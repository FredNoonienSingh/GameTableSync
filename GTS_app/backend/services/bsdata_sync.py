import io
import os
import re
import sys
import json
import time
import fcntl
import zipfile
import hashlib
import threading
import xml.etree.ElementTree as ET
from datetime import datetime
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from extensions import db
from models import (
    CatalogSystem,
    CatalogFaction,
    CatalogEntry,
    FactionCategory,
    Faction,
)

GITHUB_API_BASE = "https://api.github.com/repos"
STATUS_FILE_PATH = "/tmp/gts_bsdata_sync_status.json"
_SCHEDULER = None


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def load_catalog_repos_config() -> dict:
    """Loads initial repositories from catalog_repos.json."""
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "catalog_repos.json")
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            log(f"⚠️ [BSData Sync] Failed to read catalog_repos.json: {e}")
    return {"repositories": [], "ignored_org_repos": []}


def get_sync_status() -> dict:
    default_state = {
        "is_running": False,
        "phase": "idle",
        "current_system": None,
        "current_repo": None,
        "current_file": None,
        "repos_completed": 0,
        "repos_total": 0,
        "files_completed": 0,
        "files_total": 0,
        "percent": 0,
        "message": "Bereit.",
        "last_error": None,
        "started_at": None,
        "finished_at": None,
        "updated_at": None,
    }
    if not os.path.exists(STATUS_FILE_PATH):
        return default_state
    try:
        with open(STATUS_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            default_state.update(data)
            return default_state
    except Exception:
        return default_state


def update_sync_status(**kwargs):
    current = get_sync_status()
    current.update(kwargs)
    current["updated_at"] = datetime.utcnow().isoformat()
    try:
        tmp_path = f"{STATUS_FILE_PATH}.tmp.{os.getpid()}.{threading.get_ident()}"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(current, f)
        os.replace(tmp_path, STATUS_FILE_PATH)
    except Exception:
        pass


def _github_headers() -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "GameTableSync-Backend",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token.strip()}"
    return headers


def discover_all_bsdata_org_repos() -> list[dict]:
    cfg = load_catalog_repos_config()
    ignored = set(cfg.get("ignored_org_repos", []))
    headers = _github_headers()
    discovered = []
    page = 1
    while page <= 4:
        url = f"https://api.github.com/orgs/BSData/repos?per_page=100&type=public&sort=updated&page={page}"
        resp = requests.get(url, headers=headers, timeout=15)
        if not resp.ok:
            break
        items = resp.json()
        if not items or not isinstance(items, list):
            break
        for item in items:
            full_name = item.get("full_name")
            if not full_name or full_name in ignored or item.get("archived"):
                continue
            desc = (item.get("description") or item.get("name") or full_name).strip()
            discovered.append({
                "name": desc[:64],
                "repo": full_name,
                "default_branch": item.get("default_branch") or "main",
            })
        if len(items) < 100:
            break
        page += 1
    return discovered


def _strip_ns(tag: str) -> str:
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def _clean_faction_name(raw_name: str) -> tuple[str, str]:
    if " - " in raw_name:
        parts = raw_name.split(" - ", 1)
        return parts[0].strip(), parts[1].strip()
    return "Core Factions", raw_name.strip()


_XML_ID_RE = re.compile(rb'<catalogue\b[^>]*?\bid="([^"]+)"', re.DOTALL)
_XML_REV_RE = re.compile(rb'<catalogue\b[^>]*?\brevision="([^"]+)"', re.DOTALL)


def _should_skip_file(system_id: str, bs_cat_uuid: str, version_marker: str, force: bool) -> bool:
    if force or not bs_cat_uuid or not version_marker:
        return False
    existing_fac = CatalogFaction.query.filter_by(
        system_id=system_id, bs_uuid=bs_cat_uuid
    ).first()
    if existing_fac and existing_fac.revision == version_marker:
        return True
    return False


def _upsert_faction_and_entries(
    system_record: CatalogSystem,
    bs_cat_uuid: str,
    raw_cat_name: str,
    version_marker: str | None,
    is_library: bool,
    parsed_entries: list[dict],
):
    cat_group_name, clean_fac_name = _clean_faction_name(raw_cat_name)

    faction_rec = CatalogFaction.query.filter_by(
        system_id=system_record.id, bs_uuid=bs_cat_uuid
    ).first()

    if not faction_rec:
        faction_rec = CatalogFaction(
            system_id=system_record.id,
            bs_uuid=bs_cat_uuid,
            name=clean_fac_name[:128],
            revision=str(version_marker)[:32] if version_marker else None,
            is_library=is_library,
        )
        db.session.add(faction_rec)
        db.session.flush()
    else:
        faction_rec.name = clean_fac_name[:128]
        faction_rec.revision = str(version_marker)[:32] if version_marker else None
        faction_rec.is_library = is_library

    if not is_library and not clean_fac_name.lower().startswith("library"):
        fg_cat = FactionCategory.query.filter_by(
            system=system_record.name, name=cat_group_name[:64]
        ).first()
        if not fg_cat:
            fg_cat = FactionCategory(
                system=system_record.name[:64], name=cat_group_name[:64]
            )
            db.session.add(fg_cat)
            db.session.flush()

        fg_fac = Faction.query.filter_by(
            category_id=fg_cat.id, name=clean_fac_name[:64]
        ).first()
        if not fg_fac:
            db.session.add(Faction(category_id=fg_cat.id, name=clean_fac_name[:64]))

    existing_entries = {
        e.bs_uuid: e
        for e in CatalogEntry.query.filter_by(faction_id=faction_rec.id).all()
    }

    for item in parsed_entries:
        entry_uuid = item["bs_uuid"]
        entry_name = item["name"][:128]
        entry_type = item["entry_type"][:64]
        base_points = item["base_points"]
        profile_payload = item["profile_payload"]

        existing = existing_entries.get(entry_uuid)
        if existing:
            existing.name = entry_name
            existing.entry_type = entry_type
            existing.base_points = base_points
            existing.raw_profile_data = profile_payload
        else:
            new_entry = CatalogEntry(
                faction_id=faction_rec.id,
                bs_uuid=entry_uuid[:64],
                name=entry_name,
                entry_type=entry_type,
                base_points=base_points,
                raw_profile_data=profile_payload,
            )
            db.session.add(new_entry)
            existing_entries[entry_uuid] = new_entry

    db.session.commit()


def _extract_points_xml(element: ET.Element) -> int:
    total_pts = 0
    for child in element:
        if _strip_ns(child.tag) == "costs":
            for cost in child:
                if _strip_ns(cost.tag) == "cost":
                    c_name = (cost.attrib.get("name") or "").lower()
                    if any(k in c_name for k in ("pts", "point", "pkt", "ducat", "gold")):
                        try:
                            val = float(cost.attrib.get("value", "0"))
                            total_pts = max(total_pts, int(val))
                        except ValueError:
                            pass
    return total_pts


def _extract_profiles_xml(element: ET.Element) -> list[dict]:
    profiles = []
    for child in element:
        if _strip_ns(child.tag) == "profiles":
            for prof in child:
                if _strip_ns(prof.tag) != "profile":
                    continue
                if prof.attrib.get("hidden") == "true":
                    continue
                characteristics = {}
                for p_child in prof:
                    if _strip_ns(p_child.tag) == "characteristics":
                        for char in p_child:
                            if _strip_ns(char.tag) == "characteristic":
                                c_name = char.attrib.get("name", "Stat")
                                characteristics[c_name] = (char.text or "").strip()
                profiles.append({
                    "id": prof.attrib.get("id"),
                    "name": prof.attrib.get("name", ""),
                    "type_name": prof.attrib.get("typeName", ""),
                    "characteristics": characteristics,
                })
    return profiles


def _extract_categories_xml(element: ET.Element) -> list[str]:
    categories = []
    for child in element:
        if _strip_ns(child.tag) == "categoryLinks":
            for link in child:
                if _strip_ns(link.tag) == "categoryLink":
                    cat_name = (link.attrib.get("name") or "").strip()
                    if cat_name and cat_name not in categories:
                        categories.append(cat_name)
    return categories


def _extract_nested_options_xml(element: ET.Element) -> list[dict]:
    sub_entries = []
    for child in element:
        if _strip_ns(child.tag) == "selectionEntries":
            for sub in child:
                if _strip_ns(sub.tag) != "selectionEntry":
                    continue
                if sub.attrib.get("hidden") == "true":
                    continue
                sub_profiles = _extract_profiles_xml(sub)
                sub_pts = _extract_points_xml(sub)
                sub_entries.append({
                    "id": sub.attrib.get("id"),
                    "name": sub.attrib.get("name", ""),
                    "type": sub.attrib.get("type", "upgrade"),
                    "points": sub_pts,
                    "profiles": sub_profiles,
                })
    return sub_entries


def parse_bs_catalogue_xml(xml_bytes: bytes, system_record: CatalogSystem, force: bool = False) -> bool:
    head_chunk = xml_bytes[:2048]
    id_match = _XML_ID_RE.search(head_chunk)
    rev_match = _XML_REV_RE.search(head_chunk)
    file_hash = hashlib.sha256(xml_bytes).hexdigest()[:12]

    if id_match:
        peek_uuid = id_match.group(1).decode("utf-8", errors="ignore")
        peek_rev = rev_match.group(1).decode("utf-8", errors="ignore") if rev_match else "0"
        version_marker = f"{peek_rev}:{file_hash}"
        if _should_skip_file(system_record.id, peek_uuid, version_marker, force):
            return False

    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        log(f"⚠️ [BSData Sync] XML ParseError in {system_record.name}: {e}")
        return False

    if _strip_ns(root.tag) != "catalogue":
        return False

    bs_cat_uuid = root.attrib.get("id")
    raw_cat_name = (root.attrib.get("name") or "").strip()
    revision = root.attrib.get("revision") or "0"
    is_library = root.attrib.get("library", "false").lower() == "true"

    if not bs_cat_uuid or not raw_cat_name:
        return False

    version_marker = f"{revision}:{file_hash}"
    if _should_skip_file(system_record.id, bs_cat_uuid, version_marker, force):
        return False

    parsed_entries = []
    for container_tag in ("selectionEntries", "sharedSelectionEntries"):
        for child in root:
            if _strip_ns(child.tag) != container_tag:
                continue
            for entry_el in child:
                if _strip_ns(entry_el.tag) != "selectionEntry":
                    continue
                if entry_el.attrib.get("hidden") == "true":
                    continue

                entry_uuid = entry_el.attrib.get("id")
                entry_name = (entry_el.attrib.get("name") or "").strip()
                entry_type = (entry_el.attrib.get("type") or "unit").strip().lower()

                if not entry_uuid or not entry_name:
                    continue

                base_points = _extract_points_xml(entry_el)
                profiles = _extract_profiles_xml(entry_el)
                keywords = _extract_categories_xml(entry_el)
                options = _extract_nested_options_xml(entry_el)

                if entry_type == "upgrade" and not profiles and base_points == 0:
                    continue

                parsed_entries.append({
                    "bs_uuid": entry_uuid,
                    "name": entry_name,
                    "entry_type": entry_type,
                    "base_points": base_points,
                    "profile_payload": {
                        "profiles": profiles,
                        "keywords": keywords,
                        "options": options,
                    },
                })

    _upsert_faction_and_entries(
        system_record=system_record,
        bs_cat_uuid=bs_cat_uuid,
        raw_cat_name=raw_cat_name,
        version_marker=version_marker,
        is_library=is_library,
        parsed_entries=parsed_entries,
    )
    return True


def _extract_points_json(node: dict) -> int:
    total_pts = 0
    for cost in node.get("costs", []) or []:
        if not isinstance(cost, dict):
            continue
        c_name = str(cost.get("name") or "").lower()
        if any(k in c_name for k in ("pts", "point", "pkt", "ducat", "gold")):
            try:
                total_pts = max(total_pts, int(float(cost.get("value", 0))))
            except (ValueError, TypeError):
                pass
    return total_pts


def _extract_profiles_json(node: dict) -> list[dict]:
    profiles = []
    for prof in node.get("profiles", []) or []:
        if not isinstance(prof, dict) or prof.get("hidden") is True:
            continue
        characteristics = {}
        for char in prof.get("characteristics", []) or []:
            if isinstance(char, dict):
                c_name = char.get("name", "Stat")
                c_val = char.get("$text") if "$text" in char else char.get("value", "")
                characteristics[c_name] = str(c_val or "").strip()
        profiles.append({
            "id": prof.get("id"),
            "name": prof.get("name", ""),
            "type_name": prof.get("typeName", ""),
            "characteristics": characteristics,
        })
    return profiles


def parse_bs_catalogue_json(json_bytes: bytes, system_record: CatalogSystem, force: bool = False) -> bool:
    file_hash = hashlib.sha256(json_bytes).hexdigest()[:12]
    try:
        data = json.loads(json_bytes.decode("utf-8"))
    except Exception:
        return False

    cat_node = data.get("catalogue") if isinstance(data, dict) else None
    if not isinstance(cat_node, dict):
        return False

    bs_cat_uuid = cat_node.get("id")
    raw_cat_name = (cat_node.get("name") or "").strip()
    revision = cat_node.get("revision") or "0"
    is_library = str(cat_node.get("library", "false")).lower() == "true"

    if not bs_cat_uuid or not raw_cat_name:
        return False

    version_marker = f"{revision}:{file_hash}"
    if _should_skip_file(system_record.id, bs_cat_uuid, version_marker, force):
        return False

    parsed_entries = []
    for key in ("selectionEntries", "sharedSelectionEntries"):
        entries_list = cat_node.get(key) or []
        if not isinstance(entries_list, list):
            continue
        for entry_obj in entries_list:
            if not isinstance(entry_obj, dict) or entry_obj.get("hidden") is True:
                continue
            entry_uuid = entry_obj.get("id")
            entry_name = (entry_obj.get("name") or "").strip()
            entry_type = (entry_obj.get("type") or "unit").strip().lower()
            if not entry_uuid or not entry_name:
                continue

            base_points = _extract_points_json(entry_obj)
            profiles = _extract_profiles_json(entry_obj)
            keywords = [
                str(c.get("name")).strip()
                for c in (entry_obj.get("categoryLinks") or [])
                if isinstance(c, dict) and c.get("name")
            ]

            options = []
            for sub in entry_obj.get("selectionEntries") or []:
                if not isinstance(sub, dict) or sub.get("hidden") is True:
                    continue
                options.append({
                    "id": sub.get("id"),
                    "name": sub.get("name", ""),
                    "type": sub.get("type", "upgrade"),
                    "points": _extract_points_json(sub),
                    "profiles": _extract_profiles_json(sub),
                })

            if entry_type == "upgrade" and not profiles and base_points == 0:
                continue

            parsed_entries.append({
                "bs_uuid": entry_uuid,
                "name": entry_name,
                "entry_type": entry_type,
                "base_points": base_points,
                "profile_payload": {
                    "profiles": profiles,
                    "keywords": keywords,
                    "options": options,
                },
            })

    _upsert_faction_and_entries(
        system_record=system_record,
        bs_cat_uuid=bs_cat_uuid,
        raw_cat_name=raw_cat_name,
        version_marker=version_marker,
        is_library=is_library,
        parsed_entries=parsed_entries,
    )
    return True


def seed_catalog_systems_from_json():
    """Seeds initial repositories from catalog_repos.json if not already in DB."""
    cfg = load_catalog_repos_config()
    for item in cfg.get("repositories", []):
        repo = item.get("repo")
        name = item.get("name")
        if not repo or not name:
            continue
        rec = CatalogSystem.query.filter_by(github_repo=repo).first()
        if not rec:
            db.session.add(CatalogSystem(name=name[:64], github_repo=repo[:128]))
    db.session.commit()


def sync_all_bsdata_repos(app, force: bool = False, discover_all_org: bool = False):
    lock_path = "/tmp/gts_bsdata_sync.lock"
    lock_file = open(lock_path, "w")
    try:
        fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log("ℹ️ [BSData Sync] Another sync process is already running; skipping.")
        lock_file.close()
        return

    try:
        with app.app_context():
            seed_catalog_systems_from_json()

            if discover_all_org:
                update_sync_status(
                    is_running=True,
                    phase="discovering",
                    percent=1,
                    message="Durchsuche GitHub BSData Organisation nach allen Repositories...",
                )
                org_repos = discover_all_bsdata_org_repos()
                for item in org_repos:
                    exists = CatalogSystem.query.filter_by(github_repo=item["repo"]).first()
                    if not exists:
                        db.session.add(
                            CatalogSystem(
                                name=item["name"],
                                github_repo=item["repo"],
                                default_branch=item["default_branch"],
                            )
                        )
                db.session.commit()

            all_systems = CatalogSystem.query.order_by(CatalogSystem.name.asc()).all()
            total_repos = len(all_systems)

            update_sync_status(
                is_running=True,
                phase="starting",
                current_system=None,
                current_repo=None,
                current_file=None,
                repos_completed=0,
                repos_total=total_repos,
                files_completed=0,
                files_total=0,
                percent=2,
                message=f"Starte BSData Delta-Check für {total_repos} Spielsysteme...",
                last_error=None,
                started_at=datetime.utcnow().isoformat(),
                finished_at=None,
            )

            headers = _github_headers()

            for idx, sys_record in enumerate(all_systems):
                repo = sys_record.github_repo
                system_name = sys_record.name
                base_repo_pct = int((idx / max(1, total_repos)) * 100)
                repo_slice_pct = 100 / max(1, total_repos)

                update_sync_status(
                    is_running=True,
                    phase="checking_sha",
                    current_system=system_name,
                    current_repo=repo,
                    current_file=None,
                    repos_completed=idx,
                    files_completed=0,
                    files_total=0,
                    percent=max(2, base_repo_pct),
                    message=f"Prüfe GitHub Commit-SHA für {system_name} ({repo})...",
                )

                try:
                    commits_url = f"{GITHUB_API_BASE}/{repo}/commits?per_page=1"
                    resp = requests.get(commits_url, headers=headers, timeout=15)
                    if not resp.ok:
                        msg = f"GitHub API {resp.status_code} für {repo}"
                        log(f"⚠️ [BSData Sync] {msg}. Skipping.")
                        update_sync_status(last_error=msg)
                        continue

                    commits_data = resp.json()
                    if not commits_data or not isinstance(commits_data, list):
                        continue

                    latest_sha = commits_data[0].get("sha")
                    if not force and sys_record.last_sync_sha == latest_sha:
                        log(f"✅ [BSData Sync] {system_name} ({repo}) unchanged ({latest_sha[:7]}).")
                        update_sync_status(
                            repos_completed=idx + 1,
                            percent=int(((idx + 1) / total_repos) * 100),
                            message=f"{system_name} unverändert ({latest_sha[:7]}).",
                        )
                        continue

                    update_sync_status(
                        is_running=True,
                        phase="downloading",
                        percent=int(base_repo_pct + repo_slice_pct * 0.15),
                        message=f"Lade Archiv für {system_name} ({latest_sha[:7]}) herunter...",
                    )
                    log(f"⬇️ [BSData Sync] Downloading {repo} @ {latest_sha[:7]}...")

                    zip_url = f"https://codeload.github.com/{repo}/zip/{latest_sha}"
                    zip_resp = requests.get(zip_url, headers=headers, timeout=90)
                    if not zip_resp.ok:
                        msg = f"Download fehlgeschlagen für {repo}: HTTP {zip_resp.status_code}"
                        log(f"⚠️ [BSData Sync] {msg}")
                        update_sync_status(last_error=msg)
                        continue

                    updated_files = 0
                    skipped_files = 0
                    with zipfile.ZipFile(io.BytesIO(zip_resp.content)) as archive:
                        cat_members = [
                            m for m in archive.namelist()
                            if m.lower().endswith((".cat", ".catz", ".json"))
                            and not m.lower().endswith(("package.json", "catpkg.json", "tsconfig.json"))
                        ]
                        total_files = len(cat_members)

                        for f_idx, member_name in enumerate(cat_members):
                            short_file = member_name.split("/")[-1]
                            file_fraction = (f_idx + 1) / max(1, total_files)
                            current_pct = int(
                                base_repo_pct + repo_slice_pct * (0.2 + 0.75 * file_fraction)
                            )

                            update_sync_status(
                                is_running=True,
                                phase="parsing",
                                current_file=short_file,
                                files_completed=f_idx + 1,
                                files_total=total_files,
                                percent=min(99, current_pct),
                                message=f"[{system_name}] Prüfe/Parse {short_file} ({f_idx + 1}/{total_files})...",
                            )

                            lower_name = member_name.lower()
                            try:
                                if lower_name.endswith(".cat"):
                                    changed = parse_bs_catalogue_xml(
                                        archive.read(member_name), sys_record, force=force
                                    )
                                    if changed:
                                        updated_files += 1
                                    else:
                                        skipped_files += 1
                                elif lower_name.endswith(".catz"):
                                    inner_bytes = archive.read(member_name)
                                    with zipfile.ZipFile(io.BytesIO(inner_bytes)) as inner_zip:
                                        for inner_name in inner_zip.namelist():
                                            if inner_name.lower().endswith(".cat"):
                                                changed = parse_bs_catalogue_xml(
                                                    inner_zip.read(inner_name), sys_record, force=force
                                                )
                                                if changed:
                                                    updated_files += 1
                                                else:
                                                    skipped_files += 1
                                elif lower_name.endswith(".json"):
                                    changed = parse_bs_catalogue_json(
                                        archive.read(member_name), sys_record, force=force
                                    )
                                    if changed:
                                        updated_files += 1
                                    else:
                                        skipped_files += 1
                            except Exception as file_err:
                                db.session.rollback()
                                log(f"⚠️ [BSData Sync] Error in {short_file}: {file_err}")

                            # Yield GIL for 30ms between files so Gunicorn HTTP threads never block
                            time.sleep(0.03)

                    sys_record.last_sync_sha = latest_sha
                    sys_record.last_synced_at = datetime.utcnow()
                    db.session.commit()
                    log(
                        f"🎲 [BSData Sync] {system_name}: {updated_files} updated, {skipped_files} unchanged (SHA: {latest_sha[:7]})."
                    )

                    update_sync_status(
                        repos_completed=idx + 1,
                        percent=int(((idx + 1) / total_repos) * 100),
                        message=f"{system_name}: {updated_files} aktualisiert, {skipped_files} unverändert.",
                    )

                except Exception as repo_err:
                    db.session.rollback()
                    err_str = f"Fehler bei {repo}: {repo_err}"
                    log(f"CRITICAL [BSData Sync] {err_str}")
                    update_sync_status(last_error=err_str)

            log("✅ [BSData Sync] Catalog synchronization check complete.")
            update_sync_status(
                is_running=False,
                phase="completed",
                current_system=None,
                current_repo=None,
                current_file=None,
                repos_completed=total_repos,
                percent=100,
                message="Alle Spielsysteme erfolgreich synchronisiert!",
                finished_at=datetime.utcnow().isoformat(),
            )
    except Exception as fatal_err:
        update_sync_status(
            is_running=False,
            phase="error",
            last_error=str(fatal_err),
            message=f"Synchronisation abgebrochen: {fatal_err}",
            finished_at=datetime.utcnow().isoformat(),
        )
    finally:
        db.session.remove()
        try:
            fcntl.flock(lock_file, fcntl.LOCK_UN)
            lock_file.close()
        except Exception:
            pass


def spawn_sync_process(app, force: bool = False, discover_all_org: bool = False):
    """
    Immediately updates status file so UI sees 'SYNC AKTIV' on the next poll,
    then launches the GIL-yielding background daemon thread.
    """
    update_sync_status(
        is_running=True,
        phase="starting",
        percent=2,
        message="Initialisiere BSData Synchronisations-Worker...",
    )
    t = threading.Thread(
        target=sync_all_bsdata_repos,
        args=(app, force, discover_all_org),
        daemon=True,
        name="BSDataSyncWorker",
    )
    t.start()


def start_catalog_scheduler(app):
    global _SCHEDULER
    if _SCHEDULER is not None:
        return

    if os.environ.get("FLASK_DEBUG") == "1" and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        return

    with app.app_context():
        seed_catalog_systems_from_json()

    spawn_sync_process(app, force=False, discover_all_org=False)

    _SCHEDULER = BackgroundScheduler(daemon=True)
    _SCHEDULER.add_job(
        func=spawn_sync_process,
        trigger=CronTrigger(hour=4, minute=0, timezone="Europe/Berlin"),
        args=[app, False, False],
        id="daily_bsdata_sync",
        replace_existing=True,
        max_instances=1,
    )
    _SCHEDULER.start()
    log("⏰ [BSData Sync] Background scheduler active (Startup + Daily 04:00 Europe/Berlin).")