include $(TOPDIR)/rules.mk

PKG_NAME:=veci-app-pinglog
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=VeCI Contributors
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/veci-app-pinglog
  SECTION:=admin
  CATEGORY:=Administration
  SUBMENU:=VeCI Apps
  TITLE:=VeCI App: Ping Log
  PKGARCH:=all
  DEPENDS:=+veci
endef

define Package/veci-app-pinglog/description
  Background ping monitor for VeCI.
  Ships a procd daemon and an rpcd ACL granting VeCI read access to its log.
endef

define Build/Compile
endef

define Package/veci-app-pinglog/install
	$(INSTALL_DIR) $(1)/www/veci/js/addons/pinglog
	$(INSTALL_DATA) ./files/manifest.json $(1)/www/veci/js/addons/pinglog/manifest.json
	$(INSTALL_DATA) ./files/addon.js $(1)/www/veci/js/addons/pinglog/addon.js

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/veci-pinglog $(1)/usr/bin/veci-pinglog

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/pinglog.init $(1)/etc/init.d/veci-pinglog

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/acl.json $(1)/usr/share/rpcd/acl.d/veci-app-pinglog.json
endef

define Package/veci-app-pinglog/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/veci-pinglog enable
	/etc/init.d/veci-pinglog start
	/etc/init.d/rpcd reload
}
endef

define Package/veci-app-pinglog/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/veci-pinglog stop
	/etc/init.d/veci-pinglog disable
}
endef

define Package/veci-app-pinglog/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || /etc/init.d/rpcd reload 2>/dev/null
endef

$(eval $(call BuildPackage,veci-app-pinglog))
