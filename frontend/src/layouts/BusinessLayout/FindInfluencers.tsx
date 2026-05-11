import { useState, useEffect } from "react";
import { InfluencerCard } from "../../components";
import { useInfluencers } from "../../hooks/useInfluencers";

const NICHES = ["Politics", "Entertainment", "Gaming", "Cricket", "Fashion", "Tech"];

function FindInfluencers() {
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [minTrustScore, setMinTrustScore] = useState("");
  const [minFollowers, setMinFollowers] = useState(0);
  const [sort, setSort] = useState<"trustScore" | "followers" | "engagement" | "newest">("newest");

  const { influencers, loading, error, pagination, setFilters, setPage } = useInfluencers({ sort: "newest", country: "Pakistan" });

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setFilters({
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(niche && { niche }),
      ...(country && { country }),
      ...(minTrustScore && { minTrustScore: Number(minTrustScore) }),
      ...(minFollowers > 0 && { minFollowers }),
      sort,
    });
    setPage(1); // Reset page on filter change
  }, [debouncedSearch, niche, country, minTrustScore, minFollowers, sort, setFilters, setPage]);

  const resetFilters = () => {
    setSearch("");
    setNiche("");
    setCountry("Pakistan");
    setMinTrustScore("");
    setMinFollowers(0);
    setSort("newest");
    setFilters({ sort: "newest", country: "Pakistan" });
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="p-4 md:p-8 flex flex-col md:flex-row gap-6 find-influencers-layout">
        {/* Filter Sidebar */}
        <div className="w-full md:w-1/4 bg-white border border-gray-200 rounded-xl p-6 h-fit md:sticky top-24">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <img src="/src/assets/funnel.svg" alt="Filters" width={17} height={17} />
            <h2 className="font-bold text-lg text-gray-900">Filters</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Niche</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-600 outline-none focus:border-purple-500"
              >
                <option value="">All niches</option>
                {NICHES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-600 outline-none focus:border-purple-500"
              >
                <option value="">All countries</option>
                <option value="Pakistan">Pakistan</option>
                <option value="United States">United States</option>
                <option value="India">India</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="UAE">UAE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min Followers: {minFollowers > 0 ? `${(minFollowers / 1000).toFixed(0)}K+` : "Any"}
              </label>
              <input
                type="range"
                min={0} max={500000} step={10000}
                value={minFollowers}
                onChange={(e) => setMinFollowers(Number(e.target.value))}
                className="w-full accent-purple-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Min Trust Score</label>
              <select
                value={minTrustScore}
                onChange={(e) => setMinTrustScore(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-600 outline-none focus:border-purple-500"
              >
                <option value="">Any</option>
                <option value="90">90+</option>
                <option value="80">80+</option>
                <option value="70">70+</option>
              </select>
            </div>

            {/* Apply Filters button removed since filters apply dynamically */}
            <button
              onClick={resetFilters}
              className="w-full py-2.5 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="w-full md:w-3/4">
          {/* Search bar */}
          <div className="flex gap-4 mb-6">
            <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 flex items-center gap-3 shadow-sm">
              <img src="/src/assets/search.svg" alt="Search" width={17} height={17} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                // Auto-debounced
                placeholder="Search by name, niche, or location..."
                className="w-full outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Sort + count */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-500">
              {loading ? "Loading..." : `${pagination?.total ?? influencers.length} influencers found`}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-[#f3f4f6] border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none cursor-pointer"
            >
              <option value="trustScore">Highest Trust Score</option>
              <option value="followers">Most Followers</option>
              <option value="engagement">Best Engagement</option>
              <option value="newest">Newest Members</option>
            </select>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 mb-6">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                    <div className="h-3 bg-gray-200 rounded w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results grid */}
          {!loading && influencers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {influencers.map((inf) => (
                <InfluencerCard
                  key={inf._id}
                  id={inf.user?._id ?? ""}
                  name={inf.user?.name ?? "Unknown"}
                  image={inf.user?.avatar ?? `https://ui-avatars.com/api/?name=${inf.user?.name}&background=8b5cf6&color=fff`}
                  niche={inf.niche.join(", ")}
                  location={inf.location}
                  followers={inf.totalFollowers >= 1000 ? `${(inf.totalFollowers / 1000).toFixed(0)}K` : String(inf.totalFollowers)}
                  engagement={`${inf.avgEngagementRate.toFixed(1)}%`}
                  trustScore={inf.trustScore}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && influencers.length === 0 && !error && (
            <div className="text-center py-16 text-gray-400">
              <img src="/src/assets/search.svg" alt="" className="mx-auto mb-4 opacity-30" width={48} height={48} />
              <p className="text-lg">No influencers found matching your filters.</p>
              <button onClick={resetFilters} className="mt-4 text-purple-600 hover:underline text-sm">
                Clear filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 flex-wrap">
              <button
                onClick={() => setPage(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 font-medium text-sm disabled:opacity-40"
              >
                Previous
              </button>
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-medium flex items-center justify-center text-sm ${
                    pagination.page === i + 1
                      ? "bg-purple-600 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(pagination.pages, pagination.page + 1))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 font-medium text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FindInfluencers;
