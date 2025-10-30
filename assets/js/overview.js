/**
 * Overview Tab Configuration Handler (hardened, lean, collision-safe)
 */
(function (w, d, $) {
  "use strict";

  if (!w.agentHubData || !w.agentHubData.ajaxUrl || !w.agentHubData.nonce) {
    console.error("[Overview] Missing agentHubData config.");
    return;
  }

  /* ---------------- Utilities ---------------- */
  const DEBUG = !!w.agentHubData.debug;

  const log = (...args) => {
    if (DEBUG) console.log("[Overview]", ...args);
  };

  const ajaxPost = (action, payload = {}) =>
    $.ajax({
      url: w.agentHubData.ajaxUrl,
      type: "POST",
      dataType: "json",
      timeout: 20000,
      data: { action, nonce: w.agentHubData.nonce, ...payload },
    });

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const setIndicator = (status, text, dot) => {
    const $ind = $("#wallet-sync-indicator");
    $ind.removeClass().addClass(`wallet-sync-indicator ${status}`);
    const $dot = $ind.find(".status-dot");
    $dot.removeClass().addClass(`status-dot ${dot || "gray"}`);
    $ind.find(".status-text").text(text);
  };

  const showToast = (title, msg, type) =>
    typeof w.showToast === "function" ? w.showToast(title, msg, type) : alert(`${title}: ${msg}`);

  const isEthAddress = (s) => /^0x[a-fA-F0-9]{40}$/.test(String(s || "").trim());

  /* ---------------- State ---------------- */
  let userIsEditing = false;
  let originalPrice = null;
  let typingTimer = null;
  let rqSave = null;
  let rqAnalytics = null;
  let rqCheckLinks = null;

  /* ---------------- DOM Ready ---------------- */
  $(d).ready(function () {
    log("Init");

    // Capture original price once
    const parsed = parseFloat($("#overview-default-price").val());
    originalPrice = Number.isFinite(parsed) ? parsed : null;

    // Wallet input validation (debounced; only after user types)
    $(d)
      .off("keydown.ovw", "#overview-payment-wallet")
      .on("keydown.ovw", "#overview-payment-wallet", function () {
        userIsEditing = true;
      });

    $(d)
      .off("keyup.ovw", "#overview-payment-wallet")
      .on("keyup.ovw", "#overview-payment-wallet", function () {
        if (!userIsEditing) return;
        if (typingTimer) clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          const wallet = String($(this).val() || "").trim();
          if (!wallet) {
            setIndicator("wallet-status-empty", "Not synced", "gray");
            return;
          }
          if (!isEthAddress(wallet)) {
            setIndicator("wallet-status-invalid", "Invalid address format", "red");
          } else {
            setIndicator("wallet-status-valid", "Valid format - click Save to sync", "orange");
          }
        }, 120);
      });

    // Save configuration
    $(d)
      .off("click.ovw", "#save-overview-config")
      .on("click.ovw", "#save-overview-config", function (e) {
        e.preventDefault();
        const $btn = $(this);
        const wallet = String($("#overview-payment-wallet").val() || "").trim();
        const defaultPriceRaw = $("#overview-default-price").val();
        const defaultPrice = Number.isFinite(parseFloat(defaultPriceRaw)) ? defaultPriceRaw : "";

        if (!wallet) return showToast("Validation Error", "Payment wallet address is required", "error");
        if (!isEthAddress(wallet)) return showToast("Validation Error", "Invalid wallet address format", "error");

        // abort stale save
        if (rqSave?.abort) rqSave.abort();

        $btn.prop("disabled", true).html('<span class="dashicons dashicons-update-alt"></span> Saving...');
        setIndicator("wallet-status-syncing", "Syncing...", "orange pulsing");

        rqSave = ajaxPost("agent_hub_save_wallet", { wallet, default_price: defaultPrice })
          .done((res) => {
            if (res?.success) {
              $btn.html('<span class="dashicons dashicons-yes-alt"></span> Saved');
              if (res.data?.sync_success) {
                setIndicator("wallet-status-synced", "Synced", "green");
                userIsEditing = false;
                if (res.data?.message) showToast("Success", String(res.data.message), "success");

                // price change awareness
                const newPriceNum = parseFloat(defaultPrice);
                const priceChanged =
                  Number.isFinite(newPriceNum) && originalPrice !== null && newPriceNum !== originalPrice;
                if (priceChanged) {
                  log("Price changed from", originalPrice, "to", newPriceNum);
                  checkExistingLinksAndAlert(); // async
                  originalPrice = newPriceNum;
                }
              } else {
                setIndicator("wallet-status-sync-failed", "Sync failed", "red");
                const err = res?.data?.sync_error || "Failed to sync to database";
                let msg = res?.data?.message || "Save succeeded but sync failed.";
                if (/not provisioned|pending/i.test(err)) msg += " - Site registration is pending.";
                else if (/api key/i.test(err)) msg += " - Authentication issue.";
                showToast("Warning", `${msg} (Sync: ${err})`, "warning");
              }
            } else {
              setIndicator("wallet-status-sync-failed", "Sync failed", "red");
              showToast("Error", res?.data?.message || "Failed to save configuration", "error");
            }
          })
          .fail((_, __, err) => {
            setIndicator("wallet-status-sync-failed", "Sync failed - connection error", "red");
            showToast("Error", "Failed to save configuration: " + (err || "Network error"), "error");
          })
          .always(() => {
            setTimeout(
              () => $btn.prop("disabled", false).html('<span class="dashicons dashicons-admin-generic"></span> Save'),
              600,
            );
          });
      });

    /* -------- Overview Analytics (load once; no auto-refresh) -------- */
    loadOverviewAnalytics();

    log("Auto-refresh disabled - data will only refresh on page load");
  });

  /* ---------------- Analytics ---------------- */
  function loadOverviewAnalytics() {
    log("Analytics request start", { ts: new Date().toISOString(), ajax: w.agentHubData.ajaxUrl });

    if (rqAnalytics?.abort) rqAnalytics.abort();

    rqAnalytics = ajaxPost("agent_hub_get_analytics", { timeframe: "30d" })
      .done((res) => {
        const ok = !!(res?.success && res?.data && res.data.site);
        if (ok) {
          const site = res.data.site || {};
          const vals = {
            total_crawls: Number(site.total_crawls || 0),
            paid_crawls: Number(site.paid_crawls || 0),
            total_revenue: Number(site.total_revenue || 0),
            protected_pages: Number(site.protected_pages || 0),
          };
          log("Analytics site data", vals);
          $("#total-crawls").text(vals.total_crawls);
          $("#paid-crawls").text(vals.paid_crawls);
          $("#total-revenue").text("$" + vals.total_revenue.toFixed(2));
          $("#protected-pages").text(vals.protected_pages);
        } else {
          log("Analytics fallback to zeros", res);
          $("#total-crawls").text("0");
          $("#paid-crawls").text("0");
          $("#total-revenue").text("$0.00");
          $("#protected-pages").text("0");
        }
      })
      .fail((xhr, status, err) => {
        console.error("[Overview] Analytics error:", status, err, xhr?.responseText);
        $("#total-crawls").text("0");
        $("#paid-crawls").text("0");
        $("#total-revenue").text("$0.00");
        $("#protected-pages").text("0");
      });
  }

  /* ---------------- Price Change Alert ---------------- */
  function checkExistingLinksAndAlert() {
    if (rqCheckLinks?.abort) rqCheckLinks.abort();

    rqCheckLinks = ajaxPost("agent_hub_check_existing_links")
      .done((res) => {
        if (res?.success && res?.data?.has_links) {
          const count = Number(res.data.link_count || 0);
          showPriceChangeAlert(count);
        }
      })
      .fail((_, __, err) => console.error("[Overview] check links error:", err));
  }

  function showPriceChangeAlert(linkCount) {
    log("Show price change alert for", linkCount, "links");

    $("#price-change-alert").remove(); // ensure single instance

    // Build DOM safely without injecting raw HTML with variables
    const $notice = $("<div/>", {
      id: "price-change-alert",
      class: "notice notice-warning is-dismissible",
      style: "margin:20px 0; padding:15px; border-left:4px solid #f0ad4e;",
    });

    const $h4 = $("<h4/>", { style: "margin-top:0;" })
      .append($("<span/>", { class: "dashicons dashicons-warning", style: "color:#f0ad4e;" }))
      .append(" ")
      .append("Price Changed - Action Required");

    const plural = linkCount === 1 ? "" : "s";
    const areIs = linkCount === 1 ? "is" : "are";

    const $p1 = $("<p/>").append(
      "You have ",
      $("<strong/>").text(String(linkCount)),
      ` existing paid link${plural} that ${areIs} still using the old price. `,
      "To apply the new price to all your content, please regenerate your paid links.",
    );

    const $btnPrimary = $("<button/>", {
      type: "button",
      id: "go-to-content-tab",
      class: "button button-primary",
    })
      .append($("<span/>", { class: "dashicons dashicons-update" }), " ", "Go to My Content & Regenerate Links")
      .css("margin-right", "10px");

    const $btnDismiss = $("<button/>", {
      type: "button",
      id: "dismiss-price-alert",
      class: "button",
      text: "Dismiss",
    });

    const $p2 = $("<p/>").append($btnPrimary, $btnDismiss);

    $notice.append($h4, $p1, $p2);

    $(".agent-hub-config-card").after($notice);

    // Bind actions (namespaced)
    $(d)
      .off("click.ovw", "#go-to-content-tab")
      .on("click.ovw", "#go-to-content-tab", function () {
        log("Switching to content tab");
        $('.tab-button[data-tab="content"]').trigger("click");
        $("#price-change-alert").fadeOut(300, function () {
          $(this).remove();
        });
      });

    $(d)
      .off("click.ovw", "#dismiss-price-alert")
      .on("click.ovw", "#dismiss-price-alert", function () {
        $("#price-change-alert").fadeOut(300, function () {
          $(this).remove();
        });
      });

    // WP dismiss button handler (delegated)
    $(d)
      .off("click.ovw", "#price-change-alert .notice-dismiss")
      .on("click.ovw", "#price-change-alert .notice-dismiss", function () {
        $("#price-change-alert").fadeOut(300, function () {
          $(this).remove();
        });
      });
  }

  /* ---------------- Cleanup on unload ---------------- */
  $(w).on("beforeunload", function () {
    if (rqSave?.abort) rqSave.abort();
    if (rqAnalytics?.abort) rqAnalytics.abort();
    if (rqCheckLinks?.abort) rqCheckLinks.abort();
  });
})(window, document, jQuery);
