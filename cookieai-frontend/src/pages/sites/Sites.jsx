import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import ScriptModal from "../../components/sites/ScriptModal";

import { siteService } from "../../services/site.service";
import analyticsService from "../../services/analytics.service";
import {
  getActiveSiteId,
  setActiveSiteId,
  clearActiveSiteId
} from "../../utils/siteState";

/* ================= HELPERS ================= */
const normalizeDomain = (domain) => {
  if (!domain) return "";
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();
};

export default function Sites() {
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [visitorsMap, setVisitorsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "" });

  const [scriptModal, setScriptModal] = useState(false);
  const [scriptData, setScriptData] = useState(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptSite, setScriptSite] = useState(null);

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

    const domain = normalizeDomain(form.domain);

    const payload = { name };
    if (domain) payload.domain = domain;

    try {
      setCreating(true);

      const created = await siteService.createSite(payload);

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
      setDeleteTarget(null);
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
      setScriptSite(site);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Sites
          </h1>
          <p className="mt-2 text-base text-gray-500 max-w-2xl">
            Monitor and manage your web properties from a single dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadSites}
            loading={loading}
            className="bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm transition-all"
          >
            Refresh
          </Button>
          <Button
            onClick={() => setOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ring-1 ring-indigo-700/10 transition-all"
          >
            Add Site
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 border border-gray-100 shadow-sm rounded-xl">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-4 w-48 rounded" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <div className="pt-4 flex gap-2 border-t border-gray-50 mt-4">
                  <Skeleton className="h-9 w-20 rounded-lg" />
                  <Skeleton className="h-9 w-20 rounded-lg" />
                  <div className="ml-auto">
                    <Skeleton className="h-9 w-10 rounded-lg" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 border border-dashed border-gray-200 rounded-3xl bg-gray-50/30 transition-all">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
             <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
             </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No sites connected
          </h2>
          <p className="text-gray-500 text-center max-w-sm mb-8 leading-relaxed">
            Get started by adding your first website. It only takes a minute to set up tracking.
          </p>
          <Button
            onClick={() => setOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-indigo-200/50 transition-all active:scale-95"
          >
            Add your first site
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((s) => (
            <Card
              key={s.siteId}
              className="group p-6 bg-white border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex flex-col h-full">
                {/* SITE INFO */}
                <div className="flex justify-between items-start mb-6">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-sm text-gray-400 truncate mt-0.5">
                      {s.domain || "No domain added"}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                      Visitors
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                      {visitorsMap[s.siteId] ?? (
                        <span className="w-4 h-3 bg-indigo-200 animate-pulse rounded" />
                      )}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-auto pt-6 flex items-center gap-2 border-t border-gray-50">
                  <Button
                    size="sm"
                    onClick={() => goToAnalytics(s.siteId)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all"
                  >
                    Analyze
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openScriptModal(s)}
                    className="bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                  >
                    Script
                  </Button>
                  
                  <div className="ml-auto">
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group/delete"
                      title="Delete site"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Site"
      >
        <div className="p-1">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete site?</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteTarget?.name}</span>?
              {deleteTarget?.domain ? (
                <> This will permanently remove all analytics data for <span className="font-medium text-gray-900">{deleteTarget.domain}</span>.</>
              ) : (
                <> This will permanently remove all analytics data for this site.</>
              )}
            </p>
          </div>

          <div className="flex gap-3 mt-8">
            <Button
              variant="secondary"
              className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-sm ring-1 ring-red-700/10"
              loading={deleting === deleteTarget?.siteId}
              onClick={() => deleteSite(deleteTarget.siteId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* CREATE MODAL */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add New Site"
      >
        <div className="space-y-5 py-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Name</label>
            <input
              placeholder="My Awesome App"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Domain</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">https://</span>
              <input
                placeholder="example.com"
                className="w-full pl-[4.5rem] pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              Optional. Used to filter traffic for this site.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={createSite}
              loading={creating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              Create Site
            </Button>
          </div>
        </div>
      </Modal>

      {/* SCRIPT MODAL */}
      <ScriptModal
        isOpen={scriptModal}
        onClose={() => {
          setScriptModal(false);
          setScriptData(null);
          setScriptSite(null);
        }}
        scriptData={scriptData}
        site={scriptSite}
        loading={scriptLoading}
      />
    </div>
  );
}