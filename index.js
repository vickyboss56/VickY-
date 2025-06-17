/groupname <name> – Change group name
/lockgroupname <name> – Lock group name
/unlockgroupname – Unlock group name
/uid – Show group ID
/exit – group se Left Le Luga
/rkb <name> – HETTER NAME DAL 
/stop – Stop RKB command
/photo – Send photo/video after this; it will repeat every 30s
/stopphoto – Stop repeating photo/video
/forward – Reply kisi message pe kro, sabko forward ho jaega
/help – Show this help message🙂😁
        `;
        api.sendMessage(helpText.trim(), threadID);
      }
    } catch (e) {
      console.error("⚠️ Error in message handler:", e.message);
    }
  });
});
