include $(TOPDIR)/rules.mk

PKG_NAME:=veci-app-speedtest
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_MAINTAINER:=VeCI Contributors
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/veci-app-speedtest
  SECTION:=admin
  CATEGORY:=Administration
  SUBMENU:=VeCI Apps
  TITLE:=VeCI App: Speedtest
  PKGARCH:=all
  DEPENDS:=+veci
endef

define Package/veci-app-speedtest/description
  Network speed test for VeCI using Cloudflare endpoints.
  Client-only, requests no router permissions.
endef

define Build/Compile
endef

define Package/veci-app-speedtest/install
	$(INSTALL_DIR) $(1)/www/veci/js/addons/speedtest
	$(INSTALL_DATA) ./files/manifest.json $(1)/www/veci/js/addons/speedtest/manifest.json
	$(INSTALL_DATA) ./files/addon.js $(1)/www/veci/js/addons/speedtest/addon.js
	$(INSTALL_DATA) ./files/style.css $(1)/www/veci/js/addons/speedtest/style.css
endef

$(eval $(call BuildPackage,veci-app-speedtest))
