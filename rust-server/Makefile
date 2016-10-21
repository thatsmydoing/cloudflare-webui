.phony: clean

OPENSSL_VER ?= 1.0.2j
WEBUI_VER ?= 0.1.5

BUILD_DIR = /tmp/openssl-static-build
OPENSSL_PKG = openssl-$(OPENSSL_VER).tar.gz
OPENSSL_SRC = $(BUILD_DIR)/openssl-$(OPENSSL_VER)

cloudflare-webui-$(WEBUI_VER).tar.gz: target/release/cloudflare-webui
	tar -C target/release -czf cloudflare-webui-$(WEBUI_VER).tar.gz cloudflare-webui

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(BUILD_DIR)/$(OPENSSL_PKG): $(BUILD_DIR)
	cd $(BUILD_DIR) && curl -LO https://www.openssl.org/source/$(OPENSSL_PKG)

$(OPENSSL_SRC): $(BUILD_DIR)/$(OPENSSL_PKG)
	cd $(BUILD_DIR) && tar xf $(OPENSSL_PKG)

$(BUILD_DIR)/lib/libssl.a: $(OPENSSL_SRC)
	cd $(OPENSSL_SRC) && ./config -fPIC no-shared no-zlib --prefix=$(BUILD_DIR) && make && make install

target/release/cloudflare-webui: $(BUILD_DIR)/lib/libssl.a
	env OPENSSL_LIB_DIR=$(BUILD_DIR)/lib OPENSSL_INCLUDE_DIR=$(BUILD_DIR)/include OPENSSL_STATIC=yes cargo build --release

clean:
	cargo clean
