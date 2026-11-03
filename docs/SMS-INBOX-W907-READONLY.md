# W907 / WE5927: explicitly enabled SMS Inbox (read-only)
This branch adds a receive-only UI contract. A compatible
firmware service must return getConfig with ok=true, enabled boolean,
mode=receive_only; it must expose setEnabled and listMessages.
The UI hides sending, Sent Messages, Drafts and compose controls.
No background SMS polling occurs.

When the admin enables SMS and clicks Open Inbox, the provider may run
AT+CMGF=0 followed by AT+CMGL=4 with one shared bounded exclusive AT
lock. This read may mark unread messages as read; the UI warns.
The browser holds PDU data only in the current view.

The backend intentionally exposes no send, delete or unsolicited
SMS/OTP forwarding methods until prompt-aware PDU transport, consent,
and physical W907 UAT pass. The CSS asset veci/sms-center.css
must be installed to satisfy strict local CSP.
