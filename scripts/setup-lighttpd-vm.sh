#!/usr/bin/env bash
set -e

SSH="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2223 root@localhost"

echo "Setting up lighttpd on ARM VM..."
echo "Make sure the ARM VM is running (./scripts/start-vm-arm.sh)"
echo ""

echo "Installing lighttpd and dependencies..."
${SSH} "opkg update && opkg install lighttpd lighttpd-mod-cgi lighttpd-mod-setenv lighttpd-mod-alias jsonfilter"

echo "Stopping uhttpd..."
${SSH} "/etc/init.d/uhttpd stop; /etc/init.d/uhttpd disable" || true

echo "Creating VeCI directories..."
${SSH} "mkdir -p /www/veci/js/modules /www/veci/icons /etc/lighttpd/conf.d"

echo "Deploying VeCI files..."
cat veci/index.html | ${SSH} "cat > /www/veci/index.html"
cat veci/app.css | ${SSH} "cat > /www/veci/app.css"
cat veci/manifest.json | ${SSH} "cat > /www/veci/manifest.json"
cat veci/icons/icon-192.png | ${SSH} "cat > /www/veci/icons/icon-192.png"
cat veci/icons/icon-512.png | ${SSH} "cat > /www/veci/icons/icon-512.png"
cat veci/js/core.js | ${SSH} "cat > /www/veci/js/core.js"
cat veci/js/modules/dashboard.js | ${SSH} "cat > /www/veci/js/modules/dashboard.js"
cat veci/js/modules/network.js | ${SSH} "cat > /www/veci/js/modules/network.js"
cat veci/js/modules/system.js | ${SSH} "cat > /www/veci/js/modules/system.js"

echo "Deploying CGI ubus bridge..."
cat files/ubus.cgi | ${SSH} "cat > /www/veci/ubus.cgi && chmod +x /www/veci/ubus.cgi"

echo "Deploying lighttpd config..."
cat files/lighttpd-veci.conf | ${SSH} "cat > /etc/lighttpd/conf.d/50-veci.conf"

echo "Deploying rpcd ACL..."
cat rpcd-acl.json | ${SSH} "cat > /usr/share/rpcd/acl.d/veci.json"

echo "Deploying ubusd ACL for the http user..."
${SSH} "mkdir -p /usr/share/acl.d"
cat files/ubus-acl-veci.json | ${SSH} "cat > /usr/share/acl.d/veci.json"

echo "Restarting services..."
${SSH} "kill -HUP \$(pidof ubusd)"
${SSH} "/etc/init.d/rpcd restart"
${SSH} "/etc/init.d/lighttpd enable"
${SSH} "/etc/init.d/lighttpd restart"

echo ""
echo "Setup complete!"
echo "Access VeCI at: http://localhost:8081/veci/"
echo "Login with: root / (no password)"
