/**
 * Violations Tab Handler (hardened, collision-safe)
 */
(function (w, d, $) {
  "use strict";

  /* ---------- Guards ---------- */
  if (!w.jQuery) return;
  const AG = w.agentHubData || {};
  const AJAX_URL = AG.ajaxUrl || w.ajaxurl; // support either localization
  const NONCE = AG.nonce;
  if (!AJAX_URL || !NONCE) {
    console.error("[Violations] Missing AJAX config.");
    return;
  }

  /* ---------- State ---------- */
  let botPolicies = {}; // { bot_registry_id: action }
  let changedPolicies = new Set(); // tracked by DOM attrs as well
  let violationsData = null;
  let currentSortColumn = "total_violations";
  let currentSortDirection = "desc";
  let rqViolations = null; // in-flight AJAX for violations load
  let rqPolicies = null; // in-flight AJAX for policies load
  let rqSave = null; // in-flight AJAX for save

  const NF = new Intl.NumberFormat("en-US");

  /* ---------- Utils ---------- */
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const n = (v) => (Number.isFinite(+v) ? +v : 0);
  const fmtNum = (v) => NF.format(n(v));

  const ajaxPost = (action, payload = {}) =>
    $.ajax({
      url: AJAX_URL,
      method: "POST",
      dataType: "json",
      timeout: 20000,
      data: { action, nonce: NONCE, ...payload },
    });

  const setVisible = ($el, show) => (show ? $el.show() : $el.hide());

  const fmtDateTimeRelative = (dateStr) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Never";
    const now = new Date();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const showError = (message) => {
    console.error("[Violations] Error:", message);
    $("#violations-error-message").text(String(message || "Unknown error"));
    $("#violations-error").show();
  };

  /* ---------- Boot ---------- */
  $(d).ready(function () {
    // Load on tab activation (namespaced, idempotent)
    $(d).off("click.vio", '[data-tab="violations"]').on("click.vio", '[data-tab="violations"]', loadViolations);

    // Load immediately if already active
    if ($("#tab-violations").hasClass("active")) loadViolations();

    // Policy dropdown change (legacy <select> support if present)
    $(d)
      .off("change.vio", ".bot-policy-select")
      .on("change.vio", ".bot-policy-select", function () {
        const botId = $(this).data("bot-id");
        const newAction = $(this).val();
        botPolicies[botId] = newAction;
        changedPolicies.add(botId);
        $("#violations-save-policies").show();
      });

    // Save button
    $(d).off("click.vio", "#violations-save-policies").on("click.vio", "#violations-save-policies", savePolicies);

    // Sortable headers
    $(d)
      .off("click.vio", "#violations-table th.sortable")
      .on("click.vio", "#violations-table th.sortable", function () {
        const column = $(this).data("sort");
        if (column === currentSortColumn) {
          currentSortDirection = currentSortDirection === "desc" ? "asc" : "desc";
        } else {
          currentSortColumn = column;
          currentSortDirection = "desc";
        }
        if (violationsData) displayViolations(violationsData);
      });

    // Close custom dropdowns on outside click
    $(d)
      .off("click.vio", d)
      .on("click.vio", function (e) {
        if (!$(e.target).closest(".policy-dropdown-container").length) {
          $(".policy-dropdown-container.open").removeClass("open").find(".policy-dropdown-menu").hide();
        }
      });
  });

  /* ---------- Loads ---------- */
  function loadViolations() {
    const $loading = $("#violations-loading");
    const $error = $("#violations-error");
    const $table = $("#violations-table");
    const $empty = $("#violations-empty");
    const $saveBtn = $("#violations-save-policies");

    setVisible($loading, true);
    setVisible($error, false);
    setVisible($table, false);
    setVisible($empty, false);
    setVisible($saveBtn, false);
    changedPolicies.clear();

    if (rqViolations?.abort) rqViolations.abort();

    rqViolations = ajaxPost("agent_hub_get_violations_summary")
      .done((res) => {
        if (res?.success && res?.data) {
          violationsData = res.data;
          loadPolicies(); // chain
        } else {
          setVisible($loading, false);
          showError(res?.data?.message || "Failed to load violations data");
        }
      })
      .fail((_, __, err) => {
        setVisible($loading, false);
        showError("Network error: " + (err || "Unknown"));
      })
      .always(() => {
        rqViolations = null;
      });
  }

  function loadPolicies() {
    const $loading = $("#violations-loading");
    if (rqPolicies?.abort) rqPolicies.abort();

    rqPolicies = ajaxPost("agent_hub_get_site_bot_policies")
      .done((res) => {
        setVisible($loading, false);
        botPolicies = {};
        if (res?.success && Array.isArray(res?.data?.policies)) {
          res.data.policies.forEach((p) => {
            botPolicies[p.bot_registry_id] = p.action;
          });
        }
        displayViolations(violationsData);
      })
      .fail((_, __, err) => {
        setVisible($loading, false);
        console.warn("[Violations] Policies load failed:", err);
        botPolicies = {};
        displayViolations(violationsData);
      })
      .always(() => {
        rqPolicies = null;
      });
  }

  /* ---------- Render ---------- */
  function displayViolations(data) {
    const $table = $("#violations-table");
    const $tbody = $("#violations-table-body").empty();
    const $empty = $("#violations-empty");
    const $policyActions = $("#violations-policy-actions");

    // Stats
    $("#violations-total").text(fmtNum(data?.totals?.total_violations));
    $("#violations-robots").text(fmtNum(data?.totals?.robots_txt_violations));
    $("#violations-unpaid").text(fmtNum(data?.totals?.unpaid_access_violations));
    $("#violations-unique-agents").text(fmtNum(data?.totals?.unique_agents));

    const agents = Array.isArray(data?.agents) ? data.agents : [];
    if (agents.length === 0) {
      setVisible($policyActions, false);
      setVisible($empty, true);
      return;
    }

    const sortedAgents = sortAgents(agents, currentSortColumn, currentSortDirection);
    updateSortIndicators();

    // Build rows safely
    sortedAgents.forEach((agent) => {
      const $row = $("<tr/>");

      // Agent name
      $row.append($("<td/>").html("<strong>" + esc(agent.agent_name) + "</strong>"));

      // Totals
      $row.append(
        $("<td/>").append(
          $("<span/>", { class: "violation-badge violation-total" }).text(fmtNum(agent.total_violations)),
        ),
      );

      // robots.txt
      $row.append(
        $("<td/>").append(
          $("<span/>", {
            class: "violation-badge " + (n(agent.robots_txt_violations) > 0 ? "violation-robots" : "violation-none"),
          }).text(fmtNum(agent.robots_txt_violations)),
        ),
      );

      // unpaid access
      $row.append(
        $("<td/>").append(
          $("<span/>", {
            class: "violation-badge " + (n(agent.unpaid_access_violations) > 0 ? "violation-unpaid" : "violation-none"),
          }).text(fmtNum(agent.unpaid_access_violations)),
        ),
      );

      // last seen
      $row.append($("<td/>").text(fmtDateTimeRelative(agent.last_seen)));

      // policy cell (custom dropdown)
      const currentPolicy = botPolicies[agent.bot_registry_id] || "monetize";
      const labels = { monetize: "Monetized", allow: "Allowed", block: "Blocked" };

      const $container = $("<div/>", {
        class: "policy-dropdown-container",
        "data-bot-id": agent.bot_registry_id,
      });

      const $button = $("<button/>", {
        type: "button",
        class: "policy-dropdown-button",
      })
        .html(
          '<span class="policy-status-dot"></span>' +
            '<span class="policy-label">' +
            esc(labels[currentPolicy]) +
            "</span>" +
            '<svg class="policy-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">' +
            '<path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        )
        .on("click", function (e) {
          e.stopPropagation();
          // close others
          $(".policy-dropdown-container.open").not($container).removeClass("open").find(".policy-dropdown-menu").hide();
          $container.toggleClass("open");
          $menu.toggle();
        });

      const $menu = $("<div/>", { class: "policy-dropdown-menu" }).hide();
      [
        { value: "monetize", label: "Monetize", active: currentPolicy === "monetize" },
        { value: "allow", label: "Allow", active: currentPolicy === "allow" },
        { value: "block", label: "Block", active: currentPolicy === "block" },
      ].forEach((opt) => {
        const $opt = $("<div/>", {
          class: "policy-dropdown-option" + (opt.active ? " active" : ""),
          "data-value": opt.value,
          text: opt.label,
        }).on("click", function () {
          const newValue = $(this).attr("data-value");
          $menu.find(".policy-dropdown-option").removeClass("active");
          $(this).addClass("active");
          $container.removeClass("open");
          $menu.hide();
          $button.html(
            '<span class="policy-status-dot"></span>' +
              '<span class="policy-label">' +
              esc(labels[newValue]) +
              "</span>" +
              '<svg class="policy-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">' +
              '<path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
          );
          if (botPolicies[agent.bot_registry_id] !== newValue) {
            $container.addClass("policy-changed").attr("data-new-value", newValue);
            $("#violations-save-policies").show();
          } else {
            $container.removeClass("policy-changed").removeAttr("data-new-value");
          }
        });
        $menu.append($opt);
      });

      $container.append($button, $menu);
      $row.append($("<td/>", { class: "policy-cell" }).append($container));

      $tbody.append($row);
    });

    setVisible($table, true);
    setVisible($policyActions, true);
  }

  function sortAgents(agents, column, direction) {
    const dir = direction === "asc" ? 1 : -1;
    return [...agents].sort((a, b) => {
      if (column === "agent_name") {
        const A = String(a.agent_name || "").toLowerCase();
        const B = String(b.agent_name || "").toLowerCase();
        return dir * A.localeCompare(B);
      }
      if (column === "last_seen") {
        const A = a.last_seen ? new Date(a.last_seen).getTime() : 0;
        const B = b.last_seen ? new Date(b.last_seen).getTime() : 0;
        return dir * (A - B);
      }
      const A = n(a[column]);
      const B = n(b[column]);
      return dir * (A - B);
    });
  }

  function updateSortIndicators() {
    $("#violations-table th.sortable").removeClass("sorted-asc sorted-desc");
    $('#violations-table th.sortable[data-sort="' + currentSortColumn + '"]').addClass(
      "sorted-" + currentSortDirection,
    );
  }

  /* ---------- Saves ---------- */
  function savePolicies() {
    const $saveBtn = $("#violations-save-policies");
    const $loading = $("#violations-save-loading");
    const $error = $("#violations-save-error");
    const $success = $("#violations-save-success");

    $saveBtn.prop("disabled", true);
    setVisible($loading, !!$loading.length);
    setVisible($error, false);
    setVisible($success, false);

    // collect changed from UI (source of truth)
    $(".policy-dropdown-container.policy-changed").each(function () {
      const botId = $(this).attr("data-bot-id");
      const newValue = $(this).attr("data-new-value");
      if (botId && newValue) botPolicies[botId] = newValue;
    });

    const policies = Object.keys(botPolicies).map((id) => ({
      bot_registry_id: id,
      action: botPolicies[id],
    }));

    if (rqSave?.abort) rqSave.abort();

    rqSave = ajaxPost("agent_hub_update_site_bot_policies", { policies })
      .done((res) => {
        $saveBtn.prop("disabled", false);
        setVisible($loading, false);
        if (res?.success) {
          changedPolicies.clear();
          $(".policy-dropdown-container.policy-changed").removeClass("policy-changed").removeAttr("data-new-value");
          setVisible($success, !!$success.length);
          setTimeout(() => setVisible($success, false), 3000);
          $("#violations-save-policies").hide();
        } else {
          const msg = res?.data || "Failed to save policies";
          if ($error.length) {
            $("#violations-save-error-message").text(String(msg));
            setVisible($error, true);
          } else {
            showError(msg);
          }
        }
      })
      .fail((_, __, err) => {
        $saveBtn.prop("disabled", false);
        setVisible($loading, false);
        if ($error.length) {
          $("#violations-save-error-message").text("Network error: " + (err || "Unknown"));
          setVisible($error, true);
        } else {
          showError("Network error: " + (err || "Unknown"));
        }
      })
      .always(() => {
        rqSave = null;
      });
  }

  /* ---------- Cleanup ---------- */
  $(w).on("beforeunload", function () {
    if (rqViolations?.abort) rqViolations.abort();
    if (rqPolicies?.abort) rqPolicies.abort();
    if (rqSave?.abort) rqSave.abort();
  });

  /* ---------- Optional public API ---------- */
  w.agentHubViolations = w.agentHubViolations || {
    reload: loadViolations,
    save: savePolicies,
  };
})(window, document, jQuery);
