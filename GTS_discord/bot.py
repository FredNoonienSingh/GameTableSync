import os
import time
import logging
import discord
from discord.ext import commands

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
TOKEN = os.getenv("DISCORD_BOT_TOKEN")

if not TOKEN:
    logging.warning("No DISCORD_BOT_TOKEN set in GTS_discord/.env. Running in idle placeholder mode...")
    while True:
        time.sleep(3600)

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    logging.info(f"GTS Bot connected as {bot.user}")

@bot.command(name="sync")
async def sync_status(ctx: commands.Context):
    await ctx.send("GameTableSync Tactical Link: **ONLINE**")

bot.run(TOKEN)