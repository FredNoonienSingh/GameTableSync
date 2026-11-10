# 1. Stop any running containers
cd ~/gametablesync
docker compose down

# 2. Back up your environment files (since .env is usually git-ignored)
cp .env /tmp/root.env
cp GTS_app/.env /tmp/app.env
cp GTS_landingpage/.env.production /tmp/landing.env

# 3. Wipe and re-clone/pull clean from GitHub
cd ~
rm -rf gametablesync
git clone git@github.com:FredNoonienSingh/GameTableSync.git
cd gametablesync

# 4. Restore your .env files
cp /tmp/root.env .env
cp /tmp/app.env GTS_app/.env
cp /tmp/landing.env GTS_landingpage/.env.production