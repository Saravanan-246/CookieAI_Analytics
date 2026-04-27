import { apiRequest } from "./api";

/* ---------- CACHE ---------- */
let sitesCache = null;

/* ---------- HELPERS ---------- */
const normalizeDomain = (domain) => {
  if (!domain) return "";

  return domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();
};

const normalizeSite = (s) => ({
  _id: s._id,
  siteId: s.siteId || "",
  name: s.name || "Untitled Project",
  domain: s.domain || "",
});

/* ===================================================== */
export const siteService = {

  /* ---------- GET SITES ---------- */
  getSites: async (force = false) => {
    try {
      if (!force && sitesCache) {
        return sitesCache;
      }

      const res = await apiRequest.get("/sites");

      const raw =
        res?.data?.data ||
        res?.data?.sites ||
        res?.data ||
        [];

      const sites = raw.map(normalizeSite);

      sitesCache = sites;

      return sites;
    } catch (error) {
      console.error("Get sites error:", error);
      throw error;
    }
  },

  /* ---------- CREATE SITE ---------- */
  createSite: async ({ name, domain }) => {
    try {
      const payload = {
        name: name?.trim(),
        domain: normalizeDomain(domain),
      };

      const res = await apiRequest.post("/sites", payload);

      const raw =
        res?.data?.data ||
        res?.data?.site ||
        res?.data;

      const newSite = normalizeSite(raw);

      if (sitesCache) {
        sitesCache = [newSite, ...sitesCache];
      }

      return newSite;
    } catch (error) {
      console.error("Create site error:", error);
      throw error;
    }
  },

  /* ---------- DELETE SITE ---------- */
  deleteSite: async (siteId) => {
    try {
      await apiRequest.delete(`/sites/${siteId}`);

      if (sitesCache) {
        sitesCache = sitesCache.filter((s) => s.siteId !== siteId);
      }

      return true;
    } catch (error) {
      console.error("Delete site error:", error);
      throw error;
    }
  },

  /* ---------- GET SITE BY ID ---------- */
  getSiteById: async (id) => {
    try {
      // Validate siteId - return null for invalid values
      if (!id || id === "dashboard" || id === "undefined" || id === "null") {
        console.error("Invalid siteId:", id);
        return null;
      }

      const res = await apiRequest.get(`/sites/${id}`);

      const data = res?.data?.data || res?.data;

      return {
        _id: data._id,
        name: data.name || "Untitled Project",
        domain: data.domain || "",
        siteId: data.siteId || "",
        trackingInstalled: data.trackingInstalled || false,
      };
    } catch (error) {
      console.error("Get site error:", error);
      throw error;
    }
  },

  /* ---------- GET TRACKING SCRIPT ---------- */
  getScript: async (siteId) => {
    try {
      // Validate siteId
      if (!siteId || siteId === "dashboard" || siteId === "undefined" || siteId === "null") {
        console.error("Invalid siteId:", siteId);
        throw new Error("Invalid siteId");
      }

      const res = await apiRequest.get(`/sites/${siteId}/script`);

      const data = res?.data?.data || res?.data;

      return {
        siteId: data?.siteId || "",
        script: data?.script || "",
      };
    } catch (error) {
      console.error("Get script error:", error);
      throw error;
    }
  },

  /* ---------- CLEAR CACHE ---------- */
  clearCache: () => {
    sitesCache = null;
  },

  /* ---------- GET SITE STATUS ---------- */
  getSiteStatus: async (siteId) => {
    try {
      // Validate siteId
      if (!siteId || siteId === "dashboard" || siteId === "undefined" || siteId === "null") {
        console.error("Invalid siteId:", siteId);
        throw new Error("Invalid siteId");
      }

      const res = await apiRequest.get(`/sites/${siteId}/status`);

      const data = res?.data?.data || res?.data;

      return {
        isTrackingActive: data?.isTrackingActive || false,
        lastEventAt: data?.lastEventAt,
      };
    } catch (error) {
      console.error("Get site status error:", error);
      return {
        isTrackingActive: false,
        lastEventAt: null,
      };
    }
  },

};

export default siteService;