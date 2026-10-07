include $(TOPDIR)/rules.mk

PKG_NAME:=veci
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_MAINTAINER:=aicoach-alpha
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

VECI_WEB_DIR:=$(if $(wildcard ./dist/veci/index.html),./dist/veci,./veci)

define Package/veci
  SECTION:=admin
  CATEGORY:=Administration
  TITLE:=VeCI - Vendor-style Easy Configuration Interface for OpenWrt
  PKGARCH:=all
  DEPENDS:=+rpcd +jsonfilter
endef

define Package/veci/description
  Vendor-style, hardware-aware web interface for OpenWrt routers.
  Pure vanilla JavaScript SPA using OpenWrt's native ubus API.
  Works with uhttpd (standard OpenWrt) or lighttpd (TurrisOS).
endef

define Build/Compile
endef

define Package/veci/install
	$(INSTALL_DIR) $(1)/www/veci
	$(INSTALL_DATA) $(VECI_WEB_DIR)/index.html $(1)/www/veci/
	$(INSTALL_DATA) $(VECI_WEB_DIR)/app.css $(1)/www/veci/
	$(INSTALL_DATA) $(VECI_WEB_DIR)/manifest.json $(1)/www/veci/

	$(INSTALL_DIR) $(1)/www/veci/icons
	$(INSTALL_DATA) $(VECI_WEB_DIR)/icons/icon-192.png $(1)/www/veci/icons/
	$(INSTALL_DATA) $(VECI_WEB_DIR)/icons/icon-512.png $(1)/www/veci/icons/

	$(INSTALL_DIR) $(1)/www/veci/js
	$(INSTALL_DATA) $(VECI_WEB_DIR)/js/core.js $(1)/www/veci/js/

	$(INSTALL_DIR) $(1)/www/veci/js/modules
	$(INSTALL_DATA) $(VECI_WEB_DIR)/js/modules/dashboard.js $(1)/www/veci/js/modules/
	$(INSTALL_DATA) $(VECI_WEB_DIR)/js/modules/network.js $(1)/www/veci/js/modules/
	$(INSTALL_DATA) $(VECI_WEB_DIR)/js/modules/system.js $(1)/www/veci/js/modules/
	$(INSTALL_DATA) $(VECI_WEB_DIR)/js/modules/addons.js $(1)/www/veci/js/modules/

	$(INSTALL_DIR) $(1)/www/veci/js/addons

	$(INSTALL_DIR) $(1)/usr/libexec
	$(INSTALL_BIN) ./files/veci-pkg-call $(1)/usr/libexec/veci-pkg-call

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./files/rpcd-veci $(1)/usr/libexec/rpcd/veci

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./rpcd-acl.json $(1)/usr/share/rpcd/acl.d/veci.json

	$(INSTALL_DIR) $(1)/usr/share/acl.d
	$(INSTALL_DATA) ./files/ubus-acl-veci.json $(1)/usr/share/acl.d/veci.json

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/veci.config $(1)/etc/config/veci

	# Public VeCI app feed is intentionally disabled until a VeCI signing key/feed is released.

	$(INSTALL_BIN) ./files/ubus.cgi $(1)/www/veci/ubus.cgi

	$(INSTALL_DIR) $(1)/etc/lighttpd/conf.d
	$(INSTALL_DATA) ./files/lighttpd-veci.conf $(1)/etc/lighttpd/conf.d/50-veci.conf
endef

define Package/veci/conffiles
/etc/config/veci
endef

define Package/veci/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	kill -HUP $$(pidof ubusd) 2>/dev/null
	/etc/init.d/rpcd restart
	if [ -f /etc/init.d/lighttpd ]; then
		/etc/init.d/lighttpd restart
		echo "VeCI installed (lighttpd). Access at http://[router-ip]/veci/"
	else
		echo "VeCI installed. Access at http://[router-ip]/veci/"
	fi
}
endef

$(eval $(call BuildPackage,veci))
