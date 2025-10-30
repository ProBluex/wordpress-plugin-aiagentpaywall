/* content-manager.js (hardened, lean, collision-safe) */
(function (w, d, $) {
  "use strict";

  if (!w.agentHubData || !w.agentHubData.ajaxUrl || !w.agentHubData.nonce) {
    console.error("[ContentManager] Missing agentHubData config.");
    return;
  }

  /* ---------- State ---------- */
  let currentContent = [];
  let filteredContent = [];
  let sortColumn = "published";
  let sortDirection = "desc";
  let rqLoad = null; // in-flight request (abort on new)

  const nf = new Intl.NumberFormat("en-US");
  const money = (v) => {
    const n = Number(v || 0);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const ajaxPost = (action, payload = {}) =>
    $.ajax({
      url: w.agentHubData.ajaxUrl,
      type: "POST",
      dataType: "json",
      timeout: 20000,
      data: { action, nonce: w.agentHubData.nonce, ...payload },
    });

  /* ---------- Init ---------- */
  $(d).ready(function () {
    console.log("[ContentManager] Initializing content manager");

    // Tab load
    $(d)
      .off("click.cm", '[data-tab="my-content"]')
      .on("click.cm", '[data-tab="my-content"]', () => setTimeout(loadContent, 60));

    // Search (debounced)
    let searchTimer = null;
    $(d)
      .off("keyup.cm", "#content-search")
      .on("keyup.cm", "#content-search", (e) => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => handleSearch(e), 120);
      });

    // Sorting
    $(d).off("click.cm", ".sortable-column").on("click.cm", ".sortable-column", handleSort);

    // Select all / individual
    $(d).off("change.cm", "#select-all-content").on("change.cm", "#select-all-content", handleSelectAll);

    $(d).off("change.cm", ".content-checkbox").on("change.cm", ".content-checkbox", updateSelectAllState);

    // Bulk actions
    $(d).off("click.cm", "#bulk-action-apply").on("click.cm", "#bulk-action-apply", handleBulkAction);

    // Per-item actions
    $(d).off("click.cm", ".generate-link-btn").on("click.cm", ".generate-link-btn", handleGenerateLink);

    $(d).off("click.cm", ".edit-link-btn").on("click.cm", ".edit-link-btn", handleEditLink);

    // Human access toggle
    $(d).off("change.cm", ".human-access-toggle").on("change.cm", ".human-access-toggle", handleHumanAccessToggle);

    // Filters
    $(d)
      .off("change.cm", "#content-type-filter")
      .on("change.cm", "#content-type-filter", () => {
        applyFilters();
        renderContent();
      });

    $(d)
      .off("change.cm", "#content-link-filter")
      .on("change.cm", "#content-link-filter", () => {
        applyFilters();
        renderContent();
      });

    console.log("[ContentManager] Event handlers registered");
  });

  /* ---------- Load Content ---------- */
  function loadContent() {
    console.log("[ContentManager] Loading content list");

    if (rqLoad?.abort) rqLoad.abort();

    $(".content-loading").show();
    $("#content-table-container").hide();

    rqLoad = ajaxPost("agent_hub_get_content")
      .done((res) => {
        console.log("[ContentManager] Content loaded:", res);
        const list = res?.success && Array.isArray(res?.data?.content) ? res.data.content : null;
        if (!list) {
          console.error("[ContentManager] Failed to load content:", res);
          showError("Failed to load content");
          return;
        }
        // Shallow normalize
        currentContent = list.map((it) => ({
          id: it.id,
          title: String(it.title ?? ""),
          url: String(it.url ?? ""),
          type: String(it.type ?? ""),
          price: Number(it.price ?? 0),
          crawls: Number(it.crawls ?? 0),
          revenue: Number(it.revenue ?? 0),
          has_link: !!it.has_link,
          block_humans: !!it.block_humans,
          published: it.published ?? it.date ?? "", // keep original if present
        }));
        filteredContent = [...currentContent];
        renderContent();
        updateStats();
      })
      .fail((_, __, err) => {
        console.error("[ContentManager] AJAX error:", err);
        showError("Error loading content: " + (err || "Network error"));
      })
      .always(() => {
        $(".content-loading").hide();
        $("#content-table-container").show();
        rqLoad = null;
      });
  }

  /* ---------- Render Table ---------- */
  function renderContent() {
    const $tbody = $("#content-table-body").empty();

    if (!filteredContent.length) {
      $tbody.html(
        '<tr><td colspan="7" style="text-align:center; padding:40px; color:#666;">' +
          "No content found. Try adjusting your filters or publish some posts.</td></tr>",
      );
      return;
    }

    const sorted = sortContent(filteredContent);

    const rows = sorted
      .map((item) => {
        const linkStatus = item.has_link
          ? '<span style="color:#00D091;">&#10003; Protected</span>'
          : '<span style="color:#999;">Not Protected</span>';

        const toggleChecked = item.block_humans ? "checked" : "";
        const toggleLabel = item.block_humans ? "Blocked" : "Allowed";
        const humanAccessToggle = `<label class="human-access-toggle-wrapper">
           <input type="checkbox" class="human-access-toggle" data-post-id="${esc(item.id)}" ${toggleChecked} />
           <span class="toggle-slider"></span>
           <span class="toggle-label">${esc(toggleLabel)}</span>
         </label>`;

        return `
        <tr>
          <td>
            <strong>${esc(item.title)}</strong>
            <div style="color:#666; font-size:12px; margin-top:4px;">
              <a href="${esc(item.url)}" target="_blank" rel="noopener" style="color:#0073aa;">View Post</a>
            </div>
          </td>
          <td>${esc(ucfirst(item.type))}</td>
          <td>$${money(item.price)}</td>
          <td>${nf.format(item.crawls || 0)}</td>
          <td>$${money(item.revenue)}</td>
          <td>${linkStatus}</td>
          <td>${humanAccessToggle}</td>
        </tr>`;
      })
      .join("");

    $tbody.html(rows);

    console.log("[ContentManager] Rendered", sorted.length, "content items");
  }

  /* ---------- Sorting ---------- */
  function sortContent(list) {
    const col = sortColumn;
    const dir = sortDirection === "asc" ? 1 : -1;

    // A small key function to provide stable, type-aware sorting
    const keyOf = (x) => {
      const v = x[col];
      if (v == null) return "";
      // Attempt numeric compare first for numeric-like columns
      if (col === "price" || col === "crawls" || col === "revenue") {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }
      // Date-ish
      if (col === "published" || col === "date") {
        const t = new Date(v).getTime();
        return Number.isFinite(t) ? t : -Infinity;
      }
      // Fallback string lowercase
      return String(v).toLowerCase();
    };

    return [...list].sort((a, b) => {
      const ka = keyOf(a),
        kb = keyOf(b);
      if (ka < kb) return -1 * dir;
      if (ka > kb) return 1 * dir;
      // stable fallback by title
      const ta = String(a.title || "").toLowerCase();
      const tb = String(b.title || "").toLowerCase();
      if (ta < tb) return -1;
      if (ta > tb) return 1;
      return 0;
    });
  }

  function handleSort(e) {
    const column = $(e.currentTarget).data("sort");
    if (!column) return;

    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }

    $(".sortable-column").removeClass("sorted-asc sorted-desc");
    $(e.currentTarget).addClass("sorted-" + sortDirection);

    console.log("[ContentManager] Sorting by", column, sortDirection);
    renderContent();
  }

  /* ---------- Search & Filters ---------- */
  function handleSearch(e) {
    const term = String($(e.target).val() || "").toLowerCase();

    if (!term) {
      filteredContent = [...currentContent];
    } else {
      filteredContent = currentContent.filter((it) => {
        return (
          String(it.title || "")
            .toLowerCase()
            .includes(term) ||
          String(it.type || "")
            .toLowerCase()
            .includes(term)
        );
      });
    }

    applyFilters();
    renderContent();
  }

  function applyFilters() {
    const typeFilter = $("#content-type-filter").val();
    const linkFilter = $("#content-link-filter").val();
    const searchTerm = String($("#content-search").val() || "").toLowerCase();

    filteredContent = currentContent.filter((item) => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (linkFilter === "protected" && !item.has_link) return false;
      if (linkFilter === "unprotected" && item.has_link) return false;
      if (
        searchTerm &&
        !String(item.title || "")
          .toLowerCase()
          .includes(searchTerm)
      )
        return false;
      return true;
    });

    console.log("[ContentManager] Filtered to", filteredContent.length, "items");
  }

  /* ---------- Selection ---------- */
  function handleSelectAll(e) {
    const isChecked = $(e.target).is(":checked");
    $(".content-checkbox").prop("checked", isChecked);
    console.log("[ContentManager] Select all:", isChecked);
  }

  function updateSelectAllState() {
    const total = $(".content-checkbox").length;
    const checked = $(".content-checkbox:checked").length;
    $("#select-all-content").prop("checked", total > 0 && total === checked);
  }

  /* ---------- Bulk Actions ---------- */
  function handleBulkAction(e) {
    e.preventDefault();

    const action = $("#bulk-action-select").val();
    const selectedIds = $(".content-checkbox:checked")
      .map(function () {
        return $(this).val();
      })
      .get();

    if (!action) {
      showToast("No Action", "Please select a bulk action", "warning");
      return;
    }
    if (!selectedIds.length) {
      showToast("No Selection", "Please select at least one item", "warning");
      return;
    }

    console.log("[ContentManager] Bulk action:", action, "for", selectedIds.length, "items");

    if (action === "generate") {
      bulkGenerateLinks(selectedIds);
    }
  }

  function bulkGenerateLinks(postIds) {
    console.log("[ContentManager] Bulk generating links for", postIds.length, "posts");

    let completed = 0;
    let failed = 0;

    // Optional progress toast (no-op if your showToast is display-only)
    if (typeof w.showToast === "function") {
      w.showToast("Generating Links", `Processing ${postIds.length} items...`, "info");
    }

    const next = (i) => {
      if (i >= postIds.length) {
        const msg = `Generated ${completed} links` + (failed ? `, ${failed} failed` : "");
        w.showToast?.("Bulk Generation Complete", msg, completed ? "success" : "error");
        loadContent();
        return;
      }

      const post_id = postIds[i];

      ajaxPost("agent_hub_generate_link", { post_id })
        .done((res) => {
          res?.success ? completed++ : failed++;
        })
        .fail(() => {
          failed++;
        })
        .always(() => next(i + 1));
    };

    next(0);
  }

  /* ---------- Item Actions ---------- */
  function handleGenerateLink(e) {
    e.preventDefault();
    const $btn = $(e.currentTarget);
    const postId = $btn.data("id");

    console.log("[ContentManager] Generating link for post", postId);

    $btn.prop("disabled", true).text("Generating...");
    ajaxPost("agent_hub_generate_link", { post_id: postId })
      .done((res) => {
        if (res?.success) {
          w.showToast?.("Success", "Link generated successfully!", "success");
          loadContent();
        } else {
          w.showToast?.("Error", res?.data?.message || "Failed to generate link", "error");
        }
      })
      .fail((_, __, err) => w.showToast?.("Error", "Failed to generate link: " + (err || "Network error"), "error"))
      .always(() => $btn.prop("disabled", false).text("Generate Link"));
  }

  function handleEditLink(e) {
    e.preventDefault();
    const postId = $(e.currentTarget).data("id");
    const item = currentContent.find((c) => String(c.id) === String(postId));
    if (!item) return;

    console.log("[ContentManager] Editing link for post", postId);
    // Placeholder: keep existing behavior
    w.showToast?.("Edit Link", "Link editing modal coming soon!", "info");
  }

  function handleHumanAccessToggle(e) {
    const $cb = $(e.currentTarget);
    const postId = $cb.data("post-id");
    const blockHumans = $cb.is(":checked");

    console.log("[ContentManager] Toggling human access for post", postId, "block:", blockHumans);

    ajaxPost("agent_hub_toggle_human_access", {
      post_id: postId,
      block_humans: blockHumans,
    })
      .done((res) => {
        if (res?.success) {
          $cb.siblings(".toggle-label").text(blockHumans ? "Blocked" : "Allowed");
          w.showToast?.("Success", "Human access updated", "success");
        } else {
          $cb.prop("checked", !blockHumans);
          w.showToast?.("Error", res?.data?.message || "Failed to update human access", "error");
        }
      })
      .fail((_, __, err) => {
        $cb.prop("checked", !blockHumans);
        w.showToast?.("Error", "Failed to update human access: " + (err || "Network error"), "error");
      });
  }

  /* ---------- Stats ---------- */
  function updateStats() {
    const total = currentContent.length;
    const protectedCount = currentContent.filter((c) => c.has_link).length;
    const unprotected = total - protectedCount;

    $("#stat-total-content").text(nf.format(total));
    $("#stat-protected-content").text(nf.format(protectedCount));
    $("#stat-unprotected-content").text(nf.format(unprotected));
  }

  /* ---------- Utils ---------- */
  function ucfirst(str) {
    str = String(str || "");
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
  }

  function showError(message) {
    console.error("[ContentManager]", message);
    if (typeof w.showToast === "function") {
      w.showToast("Content Manager Error", String(message || "Unknown error"), "error");
    }
  }

  /* ---------- Public API (unchanged) ---------- */
  w.agentHubContent = {
    loadContent,
    refreshContent: loadContent,
  };

  console.log("[ContentManager] Module loaded successfully");
})(window, document, jQuery);
