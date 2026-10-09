include $(TOPDIR)/rules.mk

PKG_NAME:=veci
PKG_VERSION:=0.2.0
PKG_RELEASE:=1

PKG_MAINTAINER:=aicoach-alpha
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKGARCH:=all

include $(INCLUDE_DIR)/package.mk

VECI_WEB_DIR:=$(if $(wildcard ./dist/veci/index.html),./dist/veci,./veci)

define Package/veci
  SECTION:=admin
  CATEGORY:=Administration
  TITLE:=VeCI - Easy Configuration Interface for OpenWrt
  DEPENDS:=+rpcd +jsonfilter +uhttpd +uhttpd-mod-ubus +usign
endef

define Package/veci/description
 VeCI is a lightweight, hardware-aware OpenWrt administration interface.
 It presents common router tasks in a vendor-style UI while keeping OpenWrt
 UCI and ubus as the source of truth.
endef

define Build/Compile
endef

define Package/veci/install
	$(INSTALL_DIR) $(1)/www/veci
	$(CP) $(VECI_WEB_DIR)/* $(1)/www/veci/

	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./files/rpcd-veci $(1)/usr/libexec/rpcd/veci

	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/veci-firmware-auto $(1)/usr/sbin/veci-firmware-auto

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./rpcd-acl.json $(1)/usr/share/rpcd/acl.d/veci.json

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/veci.config $(1)/etc/config/veci
endef

define Package/veci/conffiles
/etc/config/veci
endef

define Package/veci/postinst
#!/bin/sh
[ -n "${IPKG_INSTROOT}" ] || {
	cron_file=/etc/crontabs/root
	mkdir -p /etc/crontabs
	touch "$$cron_file"
	grep -Fq '# veci-firmware-auto' "$$cron_file" || \
		printf '17 * * * * /usr/sbin/veci-firmware-auto >/dev/null 2>&1 # veci-firmware-auto\n' >> "$$cron_file"
	/etc/init.d/cron restart >/dev/null 2>&1 || true
	/etc/init.d/rpcd restart >/dev/null 2>&1 || true
	/etc/init.d/uhttpd restart >/dev/null 2>&1 || true
	echo "VeCI installed. Open http://[router-ip]/veci/"
}
endef

define Package/veci/prerm
#!/bin/sh
[ -n "${IPKG_INSTROOT}" ] || {
	cron_file=/etc/crontabs/root
	if [ -f "$$cron_file" ]; then
		sed -i '/# veci-firmware-auto$$/d' "$$cron_file"
	fi
	/etc/init.d/cron restart >/dev/null 2>&1 || true
}
endef

$(eval $(call BuildPackage,veci))
