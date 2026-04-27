import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import ScriptModal from "../../components/sites/ScriptModal";

import { siteService } from "../../services/site.service";
import analyticsService from "../../services/analytics.service";
import {
  getActiveSiteId,
  setActiveSiteId,
  clearActiveSiteId
} from "../../utils/siteState";

export default function Sites() {
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [visitorsMap, setVisitorsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "" });

  const [scriptModal, setScriptModal] = useState(false);
  const [scriptData, setScriptData] = useState(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  /* ================= FETCH VISITORS (NON-BLOCKING) ================= */
  const fetchVisitors = useCallback(async (list) => {
    if (!list.length) return;

    const map = {};

    await Promise.all(
      list.map(async (s) => {
        try {
          const res = await analyticsService.getSummary(s.siteId);
          map[s.siteId] =
            res?.totalPageViews ??
            res?.totalVisitors ??
            0;
        } catch {
          map[s.siteId] = 0;
        }
      })
    );

    setVisitorsMap(map);
  }, []);

  /* ================= LOAD ================= */
  const loadSites = useCallback(async () => {
    try {
      setLoading(true);

      const res = await siteService.getSites(true);
      const list = Array.isArray(res) ? res : res?.data || [];

      setSites(list);

      if (!getActiveSiteId() && list.length > 0) {
        setActiveSiteId(list[0].siteId);
      }

      // 🚀 fetch visitors AFTER render
      fetchVisitors(list);
    } catch (err) {
      console.error("Load sites error:", err);
      setSites([]);
      setVisitorsMap({});
    } finally {
      setLoading(false);
    }
  }, [fetchVisitors]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  /* ================= CREATE ================= */
  const createSite = async () => {
    const name = form.name.trim();
    if (!name) return alert("Site name required");

    let domain = form.domain
      ?.replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .trim()
      .toLowerCase();

    if (!domain) domain = "example.com";

    try {
      setCreating(true);

      const created = await siteService.createSite({ name, domain });

      setActiveSiteId(created.siteId);
      navigate(`/analytics/${created.siteId}`);

      // reset form
      setForm({ name: "", domain: "" });
      setOpen(false);

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteSite = async (siteId) => {
    try {
      setDeleting(siteId);

      await siteService.deleteSite(siteId);

      const updated = sites.filter((s) => s.siteId !== siteId);
      setSites(updated);

      setVisitorsMap((prev) => {
        const next = { ...prev };
        delete next[siteId];
        return next;
      });

      if (getActiveSiteId() === siteId) {
        clearActiveSiteId();

        if (updated.length > 0) {
          const nextSite = updated[0];
          setActiveSiteId(nextSite.siteId);
          navigate(`/analytics/${nextSite.siteId}`);
        } else {
          navigate("/sites");
        }
      }

    } catch (err) {
      console.error(err);
      loadSites();
    } finally {
      setDeleting(null);
    }
  };

  /* ================= NAVIGATE ================= */
  const goToAnalytics = (id) => {
    setActiveSiteId(id);
    navigate(`/analytics/${id}`);
  };

  /* ================= SCRIPT ================= */
  const openScriptModal = async (site) => {
    try {
      setScriptLoading(true);
      setScriptModal(true);

      const data = await siteService.getScript(site.siteId);
      setScriptData(data);
    } catch {
      alert("Failed to fetch script");
      setScriptModal(false);
    } finally {
      setScriptLoading(false);
    }
  };

  /* ================= UI ================= */
return (
  <div className="space-y-6">

    {/* ===== HEADER ===== */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Sites</h1>
        <p className="text-sm text-gray-500">
          Manage and track your websites
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={loadSites} loading={loading}>
          Refresh
        </Button>
        <Button onClick={() => setOpen(true)}>
          + Add Site
        </Button>
      </div>
    </div>

    {/* ===== CONTENT ===== */}
    {loading ? (
      /* ===== LOADING ===== */
      <div className="grid md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-16 mb-3" />
            <Skeleton className="h-4 w-20" />
          </Card>
        ))}
      </div>

    ) : sites.length === 0 ? (
      /* ===== EMPTY STATE ===== */
      <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-gray-200 rounded-2xl bg-white">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No sites yet
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          Create your first site to start tracking analytics in real-time.
        </p>
        <Button onClick={() => setOpen(true)}>
          Create Site
        </Button>
      </div>

    ) : (
      /* ===== SITES GRID ===== */
      <div className="grid md:grid-cols-3 gap-5">
        {sites.map((s) => (
          <Card
            key={s.siteId}
            className="p-5 hover:shadow-md transition border border-gray-100"
          >
            {/* SITE INFO */}
            <div className="mb-3">
              <p className="font-semibold text-gray-900">
                {s.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {s.domain || "No domain"}
              </p>
            </div>

            {/* VISITORS */}
            <div className="flex justify-between mb-4 text-sm">
              <span className="text-gray-500">Visitors</span>
              <span className="font-medium text-gray-900">
                {visitorsMap[s.siteId] ?? (
                  <span className="text-gray-400">...</span>
                )}
              </span>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => goToAnalytics(s.siteId)}
              >
                Analyze
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => openScriptModal(s)}
              >
                Script
              </Button>

              <Button
                size="sm"
                variant="danger"
                loading={deleting === s.siteId}
                onClick={() => deleteSite(s.siteId)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    )}

    {/* ===== CREATE MODAL ===== */}
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Site">
      <div className="space-y-4">
        <input
          placeholder="Site Name"
          className="input"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="example.com"
          className="input"
          value={form.domain}
          onChange={(e) =>
            setForm({ ...form, domain: e.target.value })
          }
        />

        <Button
          onClick={createSite}
          loading={creating}
          className="w-full"
        >
          Create Site
        </Button>
      </div>
    </Modal>

    {/* ===== SCRIPT MODAL ===== */}
    <ScriptModal
      isOpen={scriptModal}
      onClose={() => {
        setScriptModal(false);
        setScriptData(null);
      }}
      scriptData={scriptData}
      loading={scriptLoading}
    />
  </div>
);
}