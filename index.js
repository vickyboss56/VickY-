import login from "fca-priyansh";
import fs from "fs";
import express from "express";

const OWNER_UIDS = ["61572942397898", "100001808342073", "100005122337500", "100085671340090", "100087646701594", "100024447049530", "100031011381551", "100079985937710", "61572942397898"];
let rkbInterval = null;
let stopRequested = false;
let ibInterval = null;
let ibStopRequested = false;
const lockedGroupNames = {};

const app = express();
app.get("/", (_, res) => res.send("<h2>Messenger Bot Running</h2>"));
app.listen(20782, () => console.log("🌐 Log server: http://localhost:20782"));

// Prevent crash on error
process.on("uncaughtException", (err) => {
  console.error("❗ Uncaught Exception:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("❗ Unhandled Rejection:", reason);
});

login({ appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) }, (err, api) => {
  if (err) return console.error("❌ Login failed:", err);
  api.setOptions({ listenEvents: true });
  console.log("✅ Bot logged in and running...");

  api.listenMqtt(async (err, event) => {
    try {
      if (err || !event) return;

      const { threadID, senderID, body, messageID } = event;

      if (event.type === "event" && event.logMessageType === "log:thread-name") {
        const currentName = event.logMessageData.name;
        const lockedName = lockedGroupNames[threadID];
        if (lockedName && currentName !== lockedName) {
          try {
            await api.setTitle(lockedName, threadID);
            api.sendMessage(`Group name change mt kr🧷🔐. "${lockedName}" set kar diya.`, threadID);
          } catch (e) {
            console.error("❌ Error reverting group name:", e.message);
          }
        }
        return;
      }

      if (!body) return;
      const lowerBody = body.toLowerCase();

      const badNames = ["hannu", "syco", "anox", "avii"];
      const triggers = ["teri", "bhen", "maa", "Rndi"];
      if (badNames.some(n => lowerBody.includes(n)) && triggers.some(w => lowerBody.includes(w))) {
        return api.sendMessage(
          "teri ma Rndi hai tu msg mt kr hannu chodega teri ma  ko byy🙂 ss Lekr story Lga by",
          threadID,
          messageID
        );
      }

      if (!OWNER_UIDS.includes(senderID)) return;

      const args = body.trim().split(" ");
      const cmd = args[0].toLowerCase();
      const input = args.slice(1).join(" ");

      if (cmd === "/allname") {
        try {
          const info = await api.getThreadInfo(threadID);
          const members = info.participantIDs;
          api.sendMessage(`🛠  ${members.length} ' nicknames...`, threadID);

          for (const uid of members) {
            try {
              await api.changeNickname(input, threadID, uid);
              console.log(`✅ Nickname changed for UID: ${uid}`);
              await new Promise(res => setTimeout(res, 30000));
            } catch (e) {
              console.log(`⚠️ Failed for ${uid}:`, e.message);
            }
          }

          api.sendMessage("ye gribh ka bcha to Rone Lga bkL", threadID);
        } catch (e) {
          console.error("❌ Error in /allname:", e);
          api.sendMessage("badh me kLpauga", threadID);
        }
      }

      else if (cmd === "/groupname") {
        try {
          await api.setTitle(input, threadID);
          api.sendMessage(`📝 Group name changed to: ${input}`, threadID);
        } catch {
          api.sendMessage(" klpoo🤣 rkb", threadID);
        }
      }

      else if (cmd === "/lockgroupname") {
        if (!input) return api.sendMessage("name de 🤣 gc ke Liye", threadID);
        try {
          await api.setTitle(input, threadID);
          lockedGroupNames[threadID] = input;
          api.sendMessage(`🔒 Group name  "${input}"`, threadID);
        } catch {
          api.sendMessage("❌ Locking failed.", threadID);
        }
      }

      else if (cmd === "/unlockgroupname") {
        delete lockedGroupNames[threadID];
        api.sendMessage("🔓 Group name unlocked.", threadID);
      }

      else if (cmd === "/uid") {
        api.sendMessage(`🆔 Group ID: ${threadID}`, threadID);
      }

      else if (cmd === "/exit") {
        try {
          await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
        } catch {
          api.sendMessage("❌ Can't leave group.", threadID);
        }
      }

      else if (cmd === "/rkb") {
        if (!fs.existsSync("np.txt")) return api.sendMessage("konsa gaLi du rkb ko", threadID);
        const name = input.trim();
        const lines = fs.readFileSync("np.txt", "utf8").split("\n").filter(Boolean);
        stopRequested = false;

        if (rkbInterval) clearInterval(rkbInterval);
        let index = 0;

        rkbInterval = setInterval(() => {
          if (index >= lines.length || stopRequested) {
            clearInterval(rkbInterval);
            rkbInterval = null;
            return;
          }
          api.sendMessage(`${name} ${lines[index]}`, threadID);
          index++;
        }, 40000);

        api.sendMessage(`sex hogya bche 🤣rkb ${name}`, threadID);
      }

      else if (cmd === "/ib") {
        const targetUID = input.trim();
        if (!targetUID) return api.sendMessage("uid de inbox krne ke liye 🤣", threadID);
        if (!fs.existsSync("np.txt")) return api.sendMessage("np.txt nhi mila😑", threadID);

        const lines = fs.readFileSync("np.txt", "utf8").split("\n").filter(Boolean);
        ibStopRequested = false;

        if (ibInterval) clearInterval(ibInterval);
        let index = 0;

        ibInterval = setInterval(() => {
          if (index >= lines.length || ibStopRequested) {
            clearInterval(ibInterval);
            ibInterval = null;
            api.sendMessage("📴 Inbox spam band ho gya ya error aaya", threadID);
            return;
          }

          api.sendMessage(lines[index], targetUID, (err) => {
            if (err) {
              console.error("❌ Inbox msg failed:", err.message);
              ibStopRequested = true;
            }
          });
          index++;
        }, 30000);

        api.sendMessage(`📨 Inbox  start ho gya UID: ${targetUID}`, threadID);
      }

      else if (cmd === "/stop") {
        stopRequested = true;
        ibStopRequested = true;

        if (rkbInterval) {
          clearInterval(rkbInterval);
          rkbInterval = null;
          api.sendMessage("chud gaye bche🤣 (RKB)", threadID);
        }

        if (ibInterval) {
          clearInterval(ibInterval);
          ibInterval = null;
          api.sendMessage("ib wale bche bhi chud gye🤣", threadID);
        }

        if (!rkbInterval && !ibInterval) {
          api.sendMessage("kuch bhi chalu nhi tha be chomu🤣", threadID);
        }
      }

      else if (cmd === "/help") {
        const helpText = `
📌 Available Commands:
/allname <name> – Change all nicknames
/groupname <name> – Change group name
/lockgroupname <name> – Lock group name
/unlockgroupname – Unlock group name
/uid – Show group ID
/exit – group se Left Le Luga
/rkb <name> – HETTER NAME DAL 
/ib <uid> – Inbox fyt
/stop – Stop RKB or IB fyt
/help – Show this help message🙂😁
        `;
        api.sendMessage(helpText.trim(), threadID);
      }
    } catch (e) {
      console.error("⚠️ Error in message handler:", e.message);
    }
  });
});
