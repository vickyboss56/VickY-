import { join } from "path";
import {
  IPangolinHandleEvent,
  IPangolinRun,
} from "src/types/type.pangolin-handle";
import * as fs from "fs";
import axios from "axios";

export default class AntiChangeInfoBox {
  static config = {
    name: "antichangeinfobox",
    version: "1.1.0",
    author: "Lợi + ChatGPT",
    category: "GROUP",
    description: {
      vi: "Không cho thành viên thay đổi thông tin đoạn chat",
      en: "Do not allow members to change chat information",
    },
    guide: {
      en: "[prefix]antichangeinfobox on/off",
      vi: "[prefix]antichangeinfobox on/off",
    },
  };

  static message = {
    vi: {
      onModule: "Đã bật chế độ cấm thành viên thay đổi thông tin box",
      offModule: "Đã tắt chế độ cấm thành viên thay đổi thông tin box",
    },
    en: {
      onModule: "Enabled mode to prohibit members from changing box information",
      offModule: "Disabled mode to disable members from changing box information",
    },
  };

  constructor(private client) {}

  async run({ api, event, args, ThreadData, getLang }: IPangolinRun) {
    if (args[1] == "on") {
      await ThreadData.antichangeinfobox.set(event.threadID, true);
      api.sendMessage(getLang("onModule"), event.threadID);
    }
    if (args[1] == "off") {
      await ThreadData.antichangeinfobox.set(event.threadID, false);
      api.sendMessage(getLang("offModule"), event.threadID);
    }
  }

  async handleEvent({ api, event, ThreadData, getLang }: IPangolinHandleEvent) {
    if (!event.threadID) return;
    const dataThread = await ThreadData.get(event.threadID);

    if (dataThread && dataThread.antichangeinfobox) {
      // 1️⃣: Ảnh đại diện (Group Image)
      if (event.type === "change_thread_image") {
        const imgPath = join(process.cwd(), `/public/images/${event.threadID}.png`);
        try {
          const response = await axios.get(dataThread.imageSrc, {
            responseType: "arraybuffer",
          });
          const buffer = Buffer.from(response.data);
          fs.writeFileSync(imgPath, buffer);
          const img = fs.createReadStream(imgPath);
          api.changeGroupImage(img, event.threadID, (err) => {
            if (err) return console.log("Restore image error:", err);
          });
        } catch (err) {
          console.error("Failed to restore image:", err);
        }
        return;
      }

      // 2️⃣: Emoji
      if (event.type === "change_thread_quick_reaction") {
        api.changeThreadEmoji(dataThread.emoji, event.threadID);
        return;
      }

      // 3️⃣: Group Name or Color
      switch (event.logMessageType) {
        case "log:thread-name":
          api.setTitle(dataThread.name, event.threadID);
          return;
        case "log:thread-color":
          api.changeThreadColor(dataThread.color, event.threadID);
          return;
        case "log:nickname":
          // 4️⃣: Nickname Protection
          const changedID = event.logMessageData.participant_id;
          const oldNicknames = dataThread.nicknames || {};
          const oldName = oldNicknames[changedID];

          if (oldName) {
            api.changeNickname(oldName, event.threadID, changedID, (err) => {
              if (err) console.log("Restore nickname failed:", err);
            });
          }
          return;
      }
    }
  }
}
