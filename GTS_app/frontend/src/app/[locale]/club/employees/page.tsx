'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Table,
  TextInput,
  NumberInput,
  Select,
  Switch,
  SimpleGrid,
  Alert,
  ActionIcon,
  Progress,
  Box,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconCalendarTime,
  IconLock,
  IconCheck,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconUsers,
} from '@tabler/icons-react';
import {
  useClubManagement,
  getClubAuthHeaders,
  type ClubEmployeeDto,
} from '../../../../context/ClubManagementContext';

interface ClubShiftDto {
  id: string;
  employee_id: string;
  user_id: string | null;
  display_name: string;
  is_keymaster: boolean;
  start_time: string;
  end_time: string;
  note: string | null;
}

const WEEKDAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getIsoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getShiftDurationHours(startIso: string, endIso: string): number {
  const s = new Date(startIso).getTime();
  const e = new Date(endIso).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0;
  return Number(((e - s) / 3600000).toFixed(2));
}

export default function ClubEmployeesPage() {
  const { selectedClubId, clubDetail, isOwner, refreshClubData } = useClubManagement();

  const [shifts, setShifts] = useState<ClubShiftDto[]>([]);
  const [empIdentifier, setEmpIdentifier] = useState('');
  const [empRoleTitle, setEmpRoleTitle] = useState('Keymaster');
  const [empWeeklyHours, setEmpWeeklyHours] = useState<number>(20);
  const [empIsKeymaster, setEmpIsKeymaster] = useState(true);
  const [empCanTournaments, setEmpCanTournaments] = useState(true);
  const [empCanEvents, setEmpCanEvents] = useState(true);

  // Monthly Planner State
  const [plannerMonth, setPlannerMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [shiftEmployeeId, setShiftEmployeeId] = useState<string | null>(null);
  const [shiftDate, setShiftDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [shiftStartTime, setShiftStartTime] = useState('14:00');
  const [shiftEndTime, setShiftEndTime] = useState('20:00');
  const [shiftNote, setShiftNote] = useState('');

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const canScheduleEmployees = Boolean(clubDetail?.tier_limits?.can_schedule_employees);

  const loadShifts = useCallback(async () => {
    if (!selectedClubId || !canScheduleEmployees) {
      setShifts([]);
      return;
    }
    const res = await fetch(`/api/clubs/${selectedClubId}/shifts`, {
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      setShifts(await res.json());
    }
  }, [selectedClubId, canScheduleEmployees]);

  useEffect(() => {
    loadShifts();
    if (clubDetail?.employees?.length) {
      setShiftEmployeeId((prev) => prev || clubDetail.employees![0].id);
    }
  }, [loadShifts, clubDetail?.employees]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !empIdentifier.trim()) return;
    setStatusBanner(null);

    const res = await fetch(`/api/clubs/${selectedClubId}/employees`, {
      method: 'POST',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({
        user_identifier: empIdentifier.trim(),
        role_title: empRoleTitle.trim() || 'Staff',
        weekly_hours: empWeeklyHours,
        is_keymaster: empIsKeymaster,
        can_manage_tournaments: empCanTournaments,
        can_manage_events: empCanEvents,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setEmpIdentifier('');
      await refreshClubData();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Fehler beim Hinzufügen.' });
    }
  };

  const handleUpdateEmployee = async (
    emp: ClubEmployeeDto,
    patch: Partial<ClubEmployeeDto>
  ) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/employees/${emp.id}`, {
      method: 'PUT',
      headers: getClubAuthHeaders(),
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      await refreshClubData();
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/employees/${empId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await refreshClubData();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg });
    }
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !shiftEmployeeId || !shiftDate || !shiftStartTime || !shiftEndTime) {
      return;
    }
    setStatusBanner(null);

    const startIso = `${shiftDate}T${shiftStartTime}:00`;
    const endIso = `${shiftDate}T${shiftEndTime}:00`;

    const res = await fetch(`/api/clubs/${selectedClubId}/shifts`, {
      method: 'POST',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({
        employee_id: shiftEmployeeId,
        start_time: startIso,
        end_time: endIso,
        note: shiftNote.trim() || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setShiftNote('');
      await loadShifts();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Schicht-Fehler.' });
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/shifts/${shiftId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      await loadShifts();
    }
  };

  // Compute Monthly Calendar Grid cells
  const calendarDays = useMemo(() => {
    const year = plannerMonth.getFullYear();
    const month = plannerMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = lastDay.getDate();

    const cells: { dateStr: string; dayNum: number }[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ dateStr: '', dayNum: 0 });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr: ds, dayNum: d });
    }
    return cells;
  }, [plannerMonth]);

  // Compute Weekly & Monthly Hours + Overtime Warnings per Employee for active month
  const employeeStats = useMemo(() => {
    const year = plannerMonth.getFullYear();
    const month = plannerMonth.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    const result: {
      emp: ClubEmployeeDto;
      monthlyScheduled: number;
      monthlyTarget: number;
      overtimeWeeks: { weekKey: string; scheduled: number; limit: number }[];
      hasOvertime: boolean;
    }[] = [];

    for (const emp of clubDetail?.employees || []) {
      const weeklyLimit = Number(emp.weekly_hours ?? 20);
      const monthlyTarget = Number((weeklyLimit * 4.33).toFixed(1));
      const empShifts = shifts.filter((s) => s.employee_id === emp.id);

      let monthlyScheduled = 0;
      const byWeek = new Map<string, number>();

      for (const s of empShifts) {
        const hrs = getShiftDurationHours(s.start_time, s.end_time);
        if (s.start_time.startsWith(monthPrefix)) {
          monthlyScheduled += hrs;
        }
        const wk = getIsoWeekKey(new Date(s.start_time));
        byWeek.set(wk, (byWeek.get(wk) || 0) + hrs);
      }

      const overtimeWeeks: { weekKey: string; scheduled: number; limit: number }[] = [];
      for (const [wk, totalHrs] of byWeek.entries()) {
        if (totalHrs > weeklyLimit) {
          overtimeWeeks.push({
            weekKey: wk,
            scheduled: Number(totalHrs.toFixed(1)),
            limit: weeklyLimit,
          });
        }
      }

      result.push({
        emp,
        monthlyScheduled: Number(monthlyScheduled.toFixed(1)),
        monthlyTarget,
        overtimeWeeks,
        hasOvertime: overtimeWeeks.length > 0 || monthlyScheduled > monthlyTarget,
      });
    }
    return result;
  }, [clubDetail?.employees, shifts, plannerMonth]);

  // Live preview warning if the shift currently being typed causes weekly overtime
  const draftOvertimeWarning = useMemo(() => {
    if (!shiftEmployeeId || !shiftDate || !shiftStartTime || !shiftEndTime) return null;
    const emp = (clubDetail?.employees || []).find((e) => e.id === shiftEmployeeId);
    if (!emp) return null;

    const draftStart = `${shiftDate}T${shiftStartTime}:00`;
    const draftEnd = `${shiftDate}T${shiftEndTime}:00`;
    const newHrs = getShiftDurationHours(draftStart, draftEnd);
    if (newHrs <= 0) return null;

    const targetWeek = getIsoWeekKey(new Date(draftStart));
    const existingWeekHrs = shifts
      .filter(
        (s) =>
          s.employee_id === shiftEmployeeId &&
          getIsoWeekKey(new Date(s.start_time)) === targetWeek
      )
      .reduce((acc, s) => acc + getShiftDurationHours(s.start_time, s.end_time), 0);

    const totalAfter = Number((existingWeekHrs + newHrs).toFixed(1));
    const limit = Number(emp.weekly_hours ?? 20);

    if (totalAfter > limit) {
      return `Überstunden-Warnung: ${emp.display_name} hat in Woche ${targetWeek} bereits ${existingWeekHrs.toFixed(
        1
      )}h geplant. Mit dieser Schicht (${newHrs}h) werden ${totalAfter}h von ${limit}h Wochensoll erreicht (+${(
        totalAfter - limit
      ).toFixed(1)}h Überstunden).`;
    }
    return null;
  }, [shiftEmployeeId, shiftDate, shiftStartTime, shiftEndTime, clubDetail?.employees, shifts]);

  const tierLimits = clubDetail?.tier_limits;

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }, []);

  return (
    <Stack gap="lg" maw={1100}>
      <Paper p="lg" radius="md" className="gts-panel-header">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <Title order={2} className="brand-logo gts-army-title">
              MITARBEITER & MONATSPLANER
            </Title>
            <Badge variant="outline" size="sm" className="brand-logo gts-tier-badge">
              {tierLimits?.display_label || clubDetail?.tier}
            </Badge>
          </Group>
          <Badge
            variant="outline"
            className="gts-status-badge"
            data-tone={canScheduleEmployees ? 'success' : 'muted'}
          >
            {canScheduleEmployees ? 'SCHICHTPLANER AKTIV' : 'SCHICHTPLANER AB TIER 2'}
          </Badge>
        </Group>
      </Paper>

      {statusBanner && (
        <Alert
          className="gts-alert"
          data-tone={statusBanner.type === 'success' ? 'success' : 'danger'}
          icon={
            statusBanner.type === 'success' ? (
              <IconCheck size={18} />
            ) : (
              <IconAlertTriangle size={18} />
            )
          }
          withCloseButton
          onClose={() => setStatusBanner(null)}
        >
          {statusBanner.msg}
        </Alert>
      )}

      {/* 1. EMPLOYEE ROSTER & WEEKLY HOURS CONTRACT */}
      <Paper p="lg" radius="md" className="gts-panel-card gts-form">
        <Group gap="xs" mb="md">
          <IconUsers size={18} className="gts-section-icon" />
          <Text className="gts-section-heading">
            TEAM & WOCHENSTUNDEN ({clubDetail?.employees?.length || 0})
          </Text>
        </Group>

        {isOwner && (
          <form onSubmit={handleAddEmployee}>
            <SimpleGrid
              cols={{ base: 1, sm: 4 }}
              spacing="md"
              mb="sm"
              className="gts-align-end"
            >
              <TextInput
                label="Benutzer / E-Mail"
                placeholder="staff@store.de"
                required
                value={empIdentifier}
                onChange={(e) => setEmpIdentifier(e.currentTarget.value)}
              />
              <TextInput
                label="Rolle"
                placeholder="Keymaster"
                value={empRoleTitle}
                onChange={(e) => setEmpRoleTitle(e.currentTarget.value)}
              />
              <NumberInput
                label="Wochenstunden (Soll)"
                min={1}
                max={60}
                step={1}
                value={empWeeklyHours}
                onChange={(v) => setEmpWeeklyHours(Number(v) || 20)}
              />
              <Button
                type="submit"
                variant="default"
                className="gts-btn-primary"
                leftSection={<IconPlus size={14} />}
              >
                Hinzufügen
              </Button>
            </SimpleGrid>

            <Group gap="lg" mb="md">
              <Switch
                size="xs"
                label="Keymaster"
                checked={empIsKeymaster}
                onChange={(e) => setEmpIsKeymaster(e.currentTarget.checked)}
              />
              <Switch
                size="xs"
                label="Turnier-Orga"
                checked={empCanTournaments}
                onChange={(e) => setEmpCanTournaments(e.currentTarget.checked)}
              />
              <Switch
                size="xs"
                label="Event-Orga"
                checked={empCanEvents}
                onChange={(e) => setEmpCanEvents(e.currentTarget.checked)}
              />
            </Group>
          </form>
        )}

        <Table striped highlightOnHover className="gts-data-table">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Mitarbeiter</Table.Th>
              <Table.Th>Rolle</Table.Th>
              <Table.Th>Wochenstunden</Table.Th>
              <Table.Th>Keymaster</Table.Th>
              <Table.Th>Turniere</Table.Th>
              <Table.Th>Events</Table.Th>
              {isOwner && <Table.Th>Löschen</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(clubDetail?.employees || []).map((emp) => (
              <Table.Tr key={emp.id}>
                <Table.Td fw={700} className="gts-text-heading">{emp.display_name}</Table.Td>
                <Table.Td className="gts-text-secondary">{emp.role_title}</Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    w={90}
                    min={1}
                    max={60}
                    disabled={!isOwner}
                    value={emp.weekly_hours ?? 20}
                    onChange={(v) =>
                      handleUpdateEmployee(emp, { weekly_hours: Number(v) || 20 })
                    }
                    suffix=" h/Wo"
                  />
                </Table.Td>
                <Table.Td>
                  <Switch
                    size="xs"
                    checked={emp.is_keymaster}
                    disabled={!isOwner}
                    onChange={(e) =>
                      handleUpdateEmployee(emp, { is_keymaster: e.currentTarget.checked })
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <Switch
                    size="xs"
                    checked={emp.can_manage_tournaments}
                    disabled={!isOwner}
                    onChange={(e) =>
                      handleUpdateEmployee(emp, {
                        can_manage_tournaments: e.currentTarget.checked,
                      })
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <Switch
                    size="xs"
                    checked={emp.can_manage_events}
                    disabled={!isOwner}
                    onChange={(e) =>
                      handleUpdateEmployee(emp, {
                        can_manage_events: e.currentTarget.checked,
                      })
                    }
                  />
                </Table.Td>
                {isOwner && (
                  <Table.Td>
                    <ActionIcon
                      variant="default"
                      className="gts-icon-btn-danger"
                      onClick={() => handleDeleteEmployee(emp.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* 2. MONTHLY WORK PLANNER & OVERTIME DETECTOR */}
      <Paper p="lg" radius="md" className="gts-panel-card gts-form">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Group gap="xs">
            <IconCalendarTime size={20} className="gts-section-icon" />
            <Text className="gts-section-heading">
              MONATSPLANER & ARBEITSZEIT-KONTROLLE
            </Text>
          </Group>

          {canScheduleEmployees && (
            <Group gap="xs">
              <ActionIcon
                variant="default"
                className="gts-icon-btn"
                onClick={() =>
                  setPlannerMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
              >
                <IconChevronLeft size={16} />
              </ActionIcon>
              <Badge size="md" variant="outline" className="brand-logo gts-tier-badge">
                {plannerMonth.toLocaleDateString('de-DE', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Badge>
              <ActionIcon
                variant="default"
                className="gts-icon-btn"
                onClick={() =>
                  setPlannerMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
              >
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>
          )}
        </Group>

        {!canScheduleEmployees ? (
          <Alert className="gts-alert" data-tone="warning" icon={<IconLock size={18} />}>
            <Text size="xs" fw={700}>
              Monatsplaner & Schichtplanung ab Stronghold (Tier 2) verfügbar.
            </Text>
          </Alert>
        ) : (
          <Stack gap="lg">
            {/* Employee Monthly Summary & Overtime Alerts */}
            {employeeStats.length > 0 && (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                {employeeStats.map((st) => {
                  const pct = Math.min(
                    100,
                    Math.round((st.monthlyScheduled / (st.monthlyTarget || 1)) * 100)
                  );
                  return (
                    <Box
                      key={st.emp.id}
                      p="sm"
                      className="gts-subcard gts-hours-card"
                      data-overtime={st.hasOvertime ? 'true' : undefined}
                    >
                      <Group justify="space-between" mb={4}>
                        <Text size="xs" fw={700} className="gts-text-heading">
                          {st.emp.display_name}
                        </Text>
                        <Badge
                          size="xs"
                          variant="outline"
                          className="gts-status-badge"
                          data-tone={st.hasOvertime ? 'danger' : 'success'}
                        >
                          {st.emp.weekly_hours ?? 20}h / Woche
                        </Badge>
                      </Group>
                      <Text size="xs" className="gts-text-muted" mb={4}>
                        Monat: {st.monthlyScheduled}h / ~{st.monthlyTarget}h
                      </Text>
                      <Progress
                        value={pct}
                        size="sm"
                        radius="xl"
                        className="gts-hours-progress"
                        data-overtime={st.hasOvertime ? 'true' : undefined}
                      />
                      {st.overtimeWeeks.map((ow) => (
                        <Group key={ow.weekKey} gap={4} mt={6} wrap="nowrap">
                          <IconAlertTriangle size={13} className="gts-text-danger gts-shrink-0" />
                          <Text size="xs" className="gts-text-danger" fw={700}>
                            {ow.weekKey}: {ow.scheduled}h / {ow.limit}h (+
                            {(ow.scheduled - ow.limit).toFixed(1)}h Überstunden)
                          </Text>
                        </Group>
                      ))}
                    </Box>
                  );
                })}
              </SimpleGrid>
            )}

            {/* Add Shift Form */}
            {isOwner && (clubDetail?.employees?.length || 0) > 0 && (
              <form onSubmit={handleAddShift}>
                <SimpleGrid
                  cols={{ base: 1, sm: 5 }}
                  spacing="sm"
                  className="gts-align-end"
                >
                  <Select
                    label="Mitarbeiter"
                    size="xs"
                    value={shiftEmployeeId}
                    onChange={setShiftEmployeeId}
                    data={(clubDetail?.employees || []).map((e) => ({
                      value: e.id,
                      label: `${e.display_name} (${e.weekly_hours ?? 20}h/Wo)`,
                    }))}
                  />
                  <TextInput
                    label="Datum"
                    type="date"
                    size="xs"
                    required
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Von"
                    type="time"
                    size="xs"
                    required
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Bis"
                    type="time"
                    size="xs"
                    required
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.currentTarget.value)}
                  />
                  <Button
                    type="submit"
                    size="xs"
                    variant="default"
                    className="gts-btn-primary"
                    leftSection={<IconPlus size={14} />}
                  >
                    Schicht planen
                  </Button>
                </SimpleGrid>

                {draftOvertimeWarning && (
                  <Alert
                    className="gts-alert"
                    data-tone="danger"
                    mt="sm"
                    py="xs"
                    icon={<IconAlertTriangle size={16} />}
                  >
                    <Text size="xs" fw={700}>
                      {draftOvertimeWarning}
                    </Text>
                  </Alert>
                )}
              </form>
            )}

            {/* Monthly Calendar Grid */}
            <Box>
              <Box className="gts-shift-grid gts-shift-grid-head">
                {WEEKDAY_HEADERS.map((w) => (
                  <Text key={w} ta="center" className="gts-eyebrow">
                    {w}
                  </Text>
                ))}
              </Box>

              <Box className="gts-shift-grid">
                {calendarDays.map((cell, idx) => {
                  if (!cell.dateStr) {
                    return <Box key={`empty-${idx}`} className="gts-shift-cell" data-empty="true" />;
                  }
                  const dayShifts = shifts.filter((s) =>
                    s.start_time.startsWith(cell.dateStr)
                  );
                  const isSelected = shiftDate === cell.dateStr;

                  return (
                    <Box
                      key={cell.dateStr}
                      p={6}
                      className="gts-shift-cell"
                      data-selected={isSelected ? 'true' : undefined}
                      data-today={cell.dateStr === todayStr ? 'true' : undefined}
                      onClick={() => setShiftDate(cell.dateStr)}
                    >
                      <Text size="xs" fw={700} mb={4} className="gts-shift-daynum">
                        {cell.dayNum}
                      </Text>
                      <Stack gap={4}>
                        {dayShifts.map((s) => {
                          const hrs = getShiftDurationHours(s.start_time, s.end_time);
                          return (
                            <Group
                              key={s.id}
                              justify="space-between"
                              wrap="nowrap"
                              px={4}
                              py={2}
                              className="gts-shift-chip"
                              data-overtime={
                                employeeStats.some(
                                  (st) => st.emp.id === s.employee_id && st.hasOvertime
                                )
                                  ? 'true'
                                  : undefined
                              }
                            >
                              <Text size="10px" fw={600} truncate="end">
                                {s.display_name} ({hrs}h)
                              </Text>
                              {isOwner && (
                                <ActionIcon
                                  size={14}
                                  variant="default"
                                  className="gts-icon-btn-danger"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    handleDeleteShift(s.id);
                                  }}
                                >
                                  <IconTrash size={10} />
                                </ActionIcon>
                              )}
                            </Group>
                          );
                        })}
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
