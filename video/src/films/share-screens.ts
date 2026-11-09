// Written by scripts/capture/films/share.mjs: the share film's screenshots and cursor targets.
import s_access_open from "../../screens/share/access-open.png";
import s_dialog from "../../screens/share/dialog.png";
import s_invite_ready from "../../screens/share/invite-ready.png";
import s_link_on from "../../screens/share/link-on.png";
import s_manage from "../../screens/share/manage.png";
import s_shared_page from "../../screens/share/shared-page.png";
import targets from "../../screens/share/targets.json";

export const SHOTS: Record<string, string> = { "access-open": s_access_open, "dialog": s_dialog, "invite-ready": s_invite_ready, "link-on": s_link_on, "manage": s_manage, "shared-page": s_shared_page };
export const TARGETS: Record<string, { x: number; y: number }> = targets;
