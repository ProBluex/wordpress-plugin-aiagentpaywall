/* rogue-agents.js (hardened, lean, collision-safe) */
(function (w, d, $) {
  "use strict";

  if (!w.agentHubData || !w.agentHubData.ajaxUrl || !w.agentHubData.nonce) {
    console.error("[Rogue Agents] Missing agentHubData config.");
    return;
  }

  /* ---------- State ---------- */
  let currentTimeframe = "30d";
  let rogueData = null;
  let currentViolations = [];
  let currentFilteredAgent = null;
  let rqLoad = null; // in-flight AJAX for data load
  const nf = new Intl.NumberFormat("en-US");
  const cf = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  /* ---------- Utilities ---------- */
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

  const safeText = (v) => (v == null ? "" : String(v));
  const asUTCISO = (v) => {
    const t = new Date(v);
    return isNaN(t.getTime()) ? "" : t.toISOString();
  };

  const showToast = (title, msg, type) =>
    typeof w.showToast === "function" ? w.showToast(title, msg, type) : w.alert(`${title}: ${msg}`);

  // CSV field hardening: double-quotes, and neutralize leading = + - @ (CSV injection)
  const escapeCSV = (text) => {
    let s = safeText(text);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // prefix apostrophe
    s = s.replace(/"/g, '""');
    return `"${s}"`;
  };

  const truncate = (text, len) => {
    const s = safeText(text);
    return s.length <= len ? s : s.slice(0, len) + "...";
  };

  const getTimeframeText = (t) =>
    ({
      "7d": "Last 7 Days",
      "30d": "Last 30 Days",
      "90d": "Last 90 Days",
      all: "All Time",
    })[t] || t;

  /* ---------- Event bindings (namespaced, idempotent) ---------- */
  $(d).ready(function () {
    // Load when tab becomes active
    $(d)
      .off("click.rogue", '[data-tab="rogue-agents"]')
      .on("click.rogue", '[data-tab="rogue-agents"]', () => loadRogueAgentsData());

    // Timeframe change (debounced)
    let tfTimer = null;
    $(d)
      .off("change.rogue", "#rogue-timeframe")
      .on("change.rogue", "#rogue-timeframe", function () {
        if (tfTimer) clearTimeout(tfTimer);
        tfTimer = setTimeout(() => {
          currentTimeframe = $(this).val() || "30d";
          loadRogueAgentsData();
        }, 120);
      });

    // Export CSV
    $(d)
      .off("click.rogue", "#export-rogue-report")
      .on("click.rogue", "#export-rogue-report", function () {
        if (!rogueData || !Array.isArray(rogueData.violations) || rogueData.violations.length === 0) {
          showToast("Export", "No rogue agent data to export", "warning");
          return;
        }
        exportRogueReport();
      });

    // Clear agent filter button
    $(d).off("click.rogue", "#clear-agent-filter").on("click.rogue", "#clear-agent-filter", clearAgentFilter);

    // Auto-load if already active
    if ($('[data-tab="rogue-agents"]').hasClass("active")) {
      loadRogueAgentsData();
    }
  });

  /* ---------- Data load ---------- */
  function loadRogueAgentsData() {
    if (rqLoad?.abort) rqLoad.abort();

    rqLoad = ajaxPost("agent_hub_get_rogue_agents", { timeframe: currentTimeframe })
      .done((res) => {
        if (res?.success) {
          rogueData = res.data || {};
          const total = Number(rogueData?.summary?.total_violations || 0);
          if (!rogueData.summary || total === 0) {
            showEmptyState();
          } else {
            renderRogueData(rogueData);
          }
        } else {
          const errorMsg = res?.data?.error || "Unable to load rogue agents data";
          showError(errorMsg, "api_error");
        }
      })
      .fail((xhr, status, error) => {
        console.error("[Rogue Agents] AJAX Error:", {
          status: xhr?.status,
          statusText: xhr?.statusText,
          responseText: xhr?.responseText,
          error,
        });

        let msg = "Unable to load rogue agents data";
        if (xhr?.status === 0) msg = "Cannot connect to server - check your internet connection";
        else if (xhr?.status === 401 || xhr?.status === 403)
          msg = "API key authentication failed - please check your plugin settings";
        else if (xhr?.status === 404) msg = "Site not registered - please register your site first";
        else if (xhr?.status === 500) {
          msg = "Server error - please contact support";
          try {
            const j = JSON.parse(xhr.responseText || "{}");
            if (j.error) msg += ": " + j.error;
          } catch (_) {
            /* ignore */
          }
        }
        showError(msg, "error_" + (xhr?.status || "unknown"));
      })
      .always(() => {
        rqLoad = null;
      });
  }

  /* ---------- Render root ---------- */
  function renderRogueData(data) {
    // Summary cards
    $("#rogue-total-violations").text(nf.format(Number(data?.summary?.total_violations || 0)));
    $("#rogue-lost-revenue").text(cf.format(Number(data?.summary?.lost_revenue || 0)));
    $("#rogue-unique-agents").text(nf.format(Number(data?.summary?.unique_agents || 0)));
    $("#rogue-pages-affected").text(nf.format(Number(data?.summary?.pages_affected || 0)));

    // Visibility
    const agents = Array.isArray(data?.agents) ? data.agents : [];
    if (agents.length === 0) {
      $("#rogue-agents-content").hide();
      $("#rogue-agents-empty-state").show();
      return;
    }
    $("#rogue-agents-content").show();
    $("#rogue-agents-empty-state").hide();

    renderAgentsSummary(agents);
    renderViolationLog(Array.isArray(data?.violations) ? data.violations : []);
  }

  /* ---------- Render agents summary ---------- */
  function renderAgentsSummary(agents) {
    const $tbody = $("#rogue-agents-summary").empty();

    if (!agents || agents.length === 0) {
      $tbody.append(
        $("<tr/>").append($("<td/>", { colspan: 7, style: "text-align:center;" }).text("No rogue agents found")),
      );
      return;
    }

    agents.forEach((agent) => {
      const firstViolation = asUTCISO(agent.first_violation) || "";
      const lastViolation = asUTCISO(agent.last_violation) || "";

      const $btn = $("<button/>", {
        type: "button",
        class: "button button-small view-details-btn",
        text: "View Details",
      })
        .attr("data-agent-name", safeText(agent.agent_name))
        .on("click", function () {
          filterViolationsByAgent($(this).attr("data-agent-name"));
        });

      const $row = $("<tr/>")
        .append($("<td/>").html("<strong>" + esc(agent.agent_name) + "</strong>"))
        .append($("<td/>").text(nf.format(Number(agent.total_violations || 0))))
        .append($("<td/>").text(cf.format(Number(agent.lost_revenue || 0))))
        .append($("<td/>").text(nf.format(Number(agent.pages_scraped || 0))))
        .append($("<td/>").text(firstViolation))
        .append($("<td/>").text(lastViolation))
        .append($("<td/>").append($btn));

      $tbody.append($row);
    });
  }

  /* ---------- Render violation log ---------- */
  function renderViolationLog(violations, filterAgentName) {
    const $tbody = $("#rogue-violations-log").empty();
    const $notice = $("#rogue-filter-notice");
    const $filterText = $("#filter-text");

    currentViolations = Array.isArray(violations) ? violations : [];
    currentFilteredAgent = filterAgentName || null;

    let display = currentViolations;
    if (filterAgentName) {
      display = currentViolations.filter((v) => safeText(v.agent_name) === safeText(filterAgentName));
      $notice.show();
      $filterText
        .empty()
        .append(
          $("<strong/>").text("Showing violations from: "),
          document.createTextNode(" " + safeText(filterAgentName) + " (" + nf.format(display.length) + " violations)"),
        );
    } else {
      $notice.hide();
    }

    if (!display.length) {
      const msg = filterAgentName
        ? `No violations found for agent: ${safeText(filterAgentName)}`
        : "No violations recorded";
      $tbody.append($("<tr/>").append($("<td/>", { colspan: 6, style: "text-align:center;" }).text(msg)));
      return;
    }

    const MAX_ROWS = 50;
    display.slice(0, MAX_ROWS).forEach((v) => {
      const ts = asUTCISO(v.timestamp) || "";
      const paymentRequired = cf.format(Number(v.payment_required || 0));

      const $row = $("<tr/>")
        .append($("<td/>").text(ts))
        .append($("<td/>").html("<strong>" + esc(v.agent_name) + "</strong>"))
        .append(
          $("<td/>").append(
            document.createTextNode(safeText(v.content_title) || ""),
            v.wordpress_post_id ? $("<br/>")[0] : document.createTextNode(""),
            v.wordpress_post_id
              ? $("<small/>").text("Post ID: " + safeText(v.wordpress_post_id))[0]
              : document.createTextNode(""),
          ),
        )
        .append($("<td/>").text(paymentRequired))
        .append($("<td/>").html("<code>" + esc(v.agent_ip_address) + "</code>"))
        .append($("<td/>").html("<small><code>" + esc(truncate(v.agent_user_agent, 60)) + "</code></small>"));

      $tbody.append($row);
    });

    if (display.length > MAX_ROWS) {
      $tbody.append(
        $("<tr/>").append(
          $("<td/>", {
            colspan: 6,
            style: "text-align:center; font-style:italic;",
          }).text(`Showing ${MAX_ROWS} of ${nf.format(display.length)} violations. Export CSV for full report.`),
        ),
      );
    }
  }

  /* ---------- Filter actions ---------- */
  function filterViolationsByAgent(agentName) {
    renderViolationLog(currentViolations, agentName);
    $("html, body").animate(
      { scrollTop: $("#rogue-violations-log").closest(".analytics-section").offset().top - 100 },
      500,
    );
  }

  function clearAgentFilter() {
    renderViolationLog(currentViolations, null);
  }

  /* ---------- CSV Export ---------- */
  function exportRogueReport() {
    if (!rogueData) return;

    const siteName = safeText(w.agentHubData.siteName || "Site");
    const timestamp = new Date().toISOString();
    const timeframeText = getTimeframeText(currentTimeframe);

    const lines = [];
    lines.push("Rogue Agents Violation Report");
    lines.push("Site: " + siteName);
    lines.push("Generated: " + timestamp);
    lines.push("Report Period: " + timeframeText);
    lines.push("");
    lines.push("SUMMARY");
    lines.push("Total Violations," + (rogueData.summary?.total_violations ?? 0));
    lines.push("Total Lost Revenue," + cf.format(Number(rogueData.summary?.lost_revenue || 0)));
    lines.push("Unique Rogue Agents," + (rogueData.summary?.unique_agents ?? 0));
    lines.push("Pages Affected," + (rogueData.summary?.pages_affected ?? 0));
    lines.push("");
    lines.push("DETAILED VIOLATIONS");
    lines.push(
      [
        "Timestamp (UTC)",
        "Agent Name",
        "Agent User Agent",
        "IP Address",
        "Content Title",
        "Content URL",
        "WordPress Post ID",
        "Payment Required (USD)",
        "Payment Made",
        "Violation Type",
      ]
        .map(escapeCSV)
        .join(","),
    );

    (rogueData.violations || []).forEach((v) => {
      const row = [
        safeText(v.timestamp),
        safeText(v.agent_name),
        safeText(v.agent_user_agent),
        safeText(v.agent_ip_address),
        safeText(v.content_title),
        safeText(v.content_url),
        v.wordpress_post_id == null ? "" : String(v.wordpress_post_id),
        Number(v.payment_required || 0).toFixed(2),
        v.payment_made ? "Yes" : "No",
        "Unauthorized Access",
      ]
        .map(escapeCSV)
        .join(",");

      lines.push(row);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = w.URL.createObjectURL(blob);
    const a = d.createElement("a");
    a.href = url;
    a.download = "rogue-agents-report-" + Date.now() + ".csv";
    d.body.appendChild(a);
    a.click();
    d.body.removeChild(a);
    w.URL.revokeObjectURL(url);
  }

  /* ---------- Empty / Error states ---------- */
  function showError(message, errorType) {
    console.error("[Rogue Agents]", message);
    $("#rogue-agents-content").hide();
    const $empty = $("#rogue-agents-empty-state").show().empty();

    let icon = "⚠️";
    let helpText = "";
    if (errorType === "auth_error") {
      icon = "🔒";
      helpText = "<p>Please verify your API key in the Settings tab.</p>";
    } else if (errorType === "network_error") {
      icon = "🌐";
      helpText = "<p>Please check your internet connection and try again.</p>";
    }

    $empty.append(
      $("<div/>", { style: "text-align:center; padding:40px;" })
        .append($("<div/>", { style: "font-size:48px; margin-bottom:20px;" }).text(icon))
        .append($("<h3/>", { style: "color:#d32f2f; margin-bottom:10px;" }).text(safeText(message)))
        .append(helpText)
        .append(
          $("<button/>", { type: "button", class: "button button-primary", text: "Retry" }).on("click", () =>
            loadRogueAgentsData(),
          ),
        ),
    );
  }

  function showEmptyState() {
    $("#rogue-agents-content").hide();
    $("#rogue-agents-empty-state")
      .show()
      .empty()
      .append(
        $("<div/>", { style: "text-align:center; padding:40px;" })
          .append($("<div/>", { style: "font-size:48px; margin-bottom:20px;" }).text("🛡️"))
          .append($("<h3/>", { style: "color:#4caf50; margin-bottom:10px;" }).text("No Rogue Agent Activity Detected"))
          .append(
            $("<p/>").text("Your content protection is working! No unauthorized access attempts have been recorded."),
          ),
      );
  }

  /* ---------- Optional public API ---------- */
  w.agentHubRogues = w.agentHubRogues || {
    reload: loadRogueAgentsData,
    export: exportRogueReport,
  };
})(window, document, jQuery);
