/**
 * Intelligence Feed Hub — /feeds
 * Aggregates 7 live data sources into a single command-center view:
 *  1. Social Media   — Reddit r/Iowa, r/IowaCity community posts
 *  2. Local News     — Muscatine Journal, Iowa Public Radio, Radio Iowa, The Gazette
 *  3. Iowa Gov       — Governor, Iowa DOT, Iowa DPH official RSS
 *  4. Federal Reg    — Federal Register regulations & executive orders
 *  5. Grants.gov     — Open grant opportunities for Iowa municipalities
 *  6. Census         — Muscatine County ACS demographic & economic data
 *  7. BLS            — Muscatine County unemployment, CPI, employment
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Newspaper, Globe, Building2, FileText, DollarSign,
  Users, TrendingUp, RefreshCw, ExternalLink, Search,
  MessageSquare, AlertCircle, Clock, BarChart3, Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string | number) {
  try {
    const d = typeof dateStr === "number" ? new Date(dateStr) : new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr as string;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return String(dateStr);
  }
}

function SourceBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    "Muscatine Journal": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Iowa Public Radio": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    "Radio Iowa": "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "The Gazette (Cedar Rapids)": "bg-teal-500/20 text-teal-300 border-teal-500/30",
    "Iowa Governor": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "Iowa DOT": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    "Iowa Dept of Public Health": "bg-green-500/20 text-green-300 border-green-500/30",
    "Reddit r/Iowa": "bg-red-500/20 text-red-300 border-red-500/30",
    "Reddit r/IowaCity": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${colors[name] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}>
      {name}
    </span>
  );
}

function LoadingCard() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      <span className="text-sm">Fetching live data…</span>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 py-8 px-4 text-amber-400 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Tab: Social Media ────────────────────────────────────────────────────────
function SocialTab() {
  const { data, isLoading, error, refetch } = trpc.feeds.social.useQuery(undefined, { staleTime: 5 * 60_000 });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">Live community posts from Reddit r/Iowa and r/IowaCity — citizen sentiment, service requests, and local issues.</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-slate-400 hover:text-white">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>
      {isLoading && <LoadingCard />}
      {error && <ErrorCard message={`Reddit feed unavailable: ${error.message}`} />}
      {data && data.length === 0 && <ErrorCard message="No posts returned. Reddit may be rate-limiting." />}
      <div className="space-y-2">
        {(data ?? []).map(post => (
          <div key={post.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <SourceBadge name={post.source} />
                  <span className="text-[10px] text-slate-500">u/{post.author}</span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{timeAgo(post.created)}
                  </span>
                </div>
                <a href={post.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-100 hover:text-cyan-400 transition-colors line-clamp-2">
                  {post.title}
                </a>
                {post.selftext && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{post.selftext}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs text-amber-400 font-mono">↑ {post.score}</span>
                <span className="text-xs text-slate-500">{post.numComments} comments</span>
                <a href={`https://reddit.com/r/${post.subreddit}/comments/${post.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-slate-500 hover:text-cyan-400">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Local News ──────────────────────────────────────────────────────────
function LocalNewsTab() {
  const { data, isLoading, error, refetch } = trpc.feeds.localNews.useQuery(undefined, { staleTime: 5 * 60_000 });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">Regional news from Muscatine Journal, Iowa Public Radio, Radio Iowa, and The Gazette.</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-slate-400 hover:text-white">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>
      {isLoading && <LoadingCard />}
      {error && <ErrorCard message={`News feed unavailable: ${error.message}`} />}
      <div className="space-y-2">
        {(data ?? []).map((item, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <SourceBadge name={item.source} />
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />{timeAgo(item.pubDate)}
              </span>
            </div>
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-slate-100 hover:text-cyan-400 transition-colors line-clamp-2 flex items-start gap-1">
              {item.title}
              <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-500" />
            </a>
            {item.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Iowa Government ─────────────────────────────────────────────────────
function IowaGovTab() {
  const { data, isLoading, error, refetch } = trpc.feeds.iowaGov.useQuery(undefined, { staleTime: 5 * 60_000 });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">Official Iowa state government news — Governor's office, Iowa DOT, and Iowa Department of Public Health.</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-slate-400 hover:text-white">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>
      {isLoading && <LoadingCard />}
      {error && <ErrorCard message={`Iowa Gov feed unavailable: ${error.message}`} />}
      <div className="space-y-2">
        {(data ?? []).map((item, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <SourceBadge name={item.source} />
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />{timeAgo(item.pubDate)}
              </span>
            </div>
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-slate-100 hover:text-cyan-400 transition-colors line-clamp-2 flex items-start gap-1">
              {item.title}
              <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-500" />
            </a>
            {item.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Federal Register ────────────────────────────────────────────────────
function FederalRegTab() {
  const [query, setQuery] = useState("municipal infrastructure Iowa");
  const [activeQuery, setActiveQuery] = useState("municipal infrastructure Iowa");
  const { data, isLoading, error, refetch } = trpc.feeds.federalRegister.useQuery(
    { query: activeQuery },
    { staleTime: 5 * 60_000 }
  );

  const DOC_TYPE_COLOR: Record<string, string> = {
    "Rule": "bg-red-500/20 text-red-300 border-red-500/30",
    "Proposed Rule": "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "Notice": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Presidential Document": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setActiveQuery(query)}
            placeholder="Search Federal Register…"
            className="pl-8 h-8 text-xs bg-slate-800 border-slate-600 text-slate-100"
          />
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={() => setActiveQuery(query)}>Search</Button>
        <Button variant="ghost" size="sm" className="h-8 text-slate-400" onClick={() => refetch()}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
      {isLoading && <LoadingCard />}
      {error && <ErrorCard message={`Federal Register unavailable: ${error.message}`} />}
      <div className="space-y-2">
        {(data ?? []).map(doc => (
          <div key={doc.document_number} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${DOC_TYPE_COLOR[doc.type] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}>
                {doc.type}
              </span>
              <span className="text-[10px] text-slate-500">{doc.publication_date}</span>
              <span className="text-[10px] text-slate-500 font-mono">{doc.document_number}</span>
            </div>
            <a href={doc.html_url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-slate-100 hover:text-cyan-400 transition-colors line-clamp-2 flex items-start gap-1">
              {doc.title}
              <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-500" />
            </a>
            {doc.abstract && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{doc.abstract}</p>
            )}
            {doc.agencies?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {doc.agencies.slice(0, 3).map((a, i) => (
                  <span key={i} className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">{a.name}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Grants.gov ──────────────────────────────────────────────────────────
function GrantsTab() {
  const [keyword, setKeyword] = useState("Iowa municipal infrastructure");
  const [activeKeyword, setActiveKeyword] = useState("Iowa municipal infrastructure");
  const { data, isLoading, error, refetch } = trpc.feeds.grants.useQuery(
    { keyword: activeKeyword },
    { staleTime: 5 * 60_000 }
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setActiveKeyword(keyword)}
            placeholder="Search Grants.gov…"
            className="pl-8 h-8 text-xs bg-slate-800 border-slate-600 text-slate-100"
          />
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={() => setActiveKeyword(keyword)}>Search</Button>
        <Button variant="ghost" size="sm" className="h-8 text-slate-400" onClick={() => refetch()}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
      {isLoading && <LoadingCard />}
      {error && <ErrorCard message={`Grants.gov unavailable: ${error.message}`} />}
      {data && data.length === 0 && !isLoading && (
        <div className="text-center py-8 text-slate-400 text-sm">No open opportunities found for this keyword.</div>
      )}
      <div className="space-y-2">
        {(data ?? []).map(grant => (
          <div key={grant.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-green-500/20 text-green-300 border-green-500/30">
                {grant.agency}
              </span>
              {grant.closeDate && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />Closes {grant.closeDate}
                </span>
              )}
              {grant.awardCeiling && grant.awardCeiling !== "0" && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  Up to ${Number(grant.awardCeiling).toLocaleString()}
                </span>
              )}
            </div>
            <a href={grant.url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-slate-100 hover:text-cyan-400 transition-colors line-clamp-2 flex items-start gap-1">
              {grant.title}
              <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-500" />
            </a>
            {grant.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{grant.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Census ACS ──────────────────────────────────────────────────────────
function CensusTab() {
  const { data, isLoading, error, refetch } = trpc.feeds.census.useQuery(undefined, { staleTime: 60 * 60_000 });

  const formatValue = (variable: string, value: string) => {
    const n = Number(value);
    if (isNaN(n) || n < 0) return "N/A";
    if (variable.includes("Income") || variable.includes("Rent")) return `$${n.toLocaleString()}`;
    return n.toLocaleString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">US Census Bureau ACS 5-Year Estimates — Muscatine County, Iowa (2023). Updated annually.</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-slate-400 hover:text-white">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>
      {isLoading && <LoadingCard />}
      {error && <ErrorCard message={`Census API unavailable: ${error.message}`} />}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map(row => (
            <div key={row.variable} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">{row.label}</p>
              <p className="text-2xl font-bold text-cyan-400 font-mono">
                {formatValue(row.label, row.value)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">{row.county}, {row.state}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
        <p className="text-xs text-slate-500">
          Source: <a href="https://www.census.gov/data/developers/data-sets/acs-5year.html" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">US Census Bureau ACS 5-Year Data API</a> — FIPS 19139 (Muscatine County, Iowa)
        </p>
      </div>
    </div>
  );
}

// ─── Tab: BLS Economic Data ───────────────────────────────────────────────────
function BlsTab() {
  const { data, isLoading, error, refetch } = trpc.feeds.bls.useQuery(undefined, { staleTime: 60 * 60_000 });

  const formatBls = (label: string, value: string) => {
    const n = Number(value);
    if (isNaN(n)) return value;
    if (label.includes("Rate")) return `${n.toFixed(1)}%`;
    if (label.includes("CPI")) return n.toFixed(1);
    return n.toLocaleString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">Bureau of Labor Statistics — Muscatine County unemployment, national CPI, and total nonfarm employment.</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-slate-400 hover:text-white">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>
      {isLoading && <LoadingCard />}
      {error && <ErrorCard message={`BLS API unavailable: ${error.message}`} />}
      {data && data.length === 0 && !isLoading && (
        <ErrorCard message="BLS returned no data. The API may require registration for higher rate limits." />
      )}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map(series => (
            <div key={series.seriesId} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1 line-clamp-2">{series.label}</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                {formatBls(series.label, series.latestValue)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {series.latestYear} {series.latestPeriod}
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">{series.seriesId}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
        <p className="text-xs text-slate-500">
          Source: <a href="https://www.bls.gov/bls/api_features.htm" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">BLS Public Data API v2</a> — LAUS series for Muscatine County (FIPS 19139)
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IntelFeedHub() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Intelligence Feed Hub</h1>
            <p className="text-sm text-slate-400">Live aggregation of social, news, government, regulatory, and economic data streams</p>
          </div>
        </div>

        {/* Source summary bar */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { label: "Reddit Iowa", color: "bg-red-500/20 text-red-300 border-red-500/30" },
            { label: "Local News", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
            { label: "Iowa Gov", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
            { label: "Federal Register", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
            { label: "Grants.gov", color: "bg-green-500/20 text-green-300 border-green-500/30" },
            { label: "Census ACS", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
            { label: "BLS Economic", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
          ].map(s => (
            <span key={s.label} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="social" className="w-full">
        <TabsList className="grid grid-cols-7 w-full mb-6 bg-slate-800/60 border border-slate-700/50 h-auto p-1 gap-1">
          <TabsTrigger value="social" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-slate-700">
            <MessageSquare className="w-3.5 h-3.5" />Social
          </TabsTrigger>
          <TabsTrigger value="news" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-slate-700">
            <Newspaper className="w-3.5 h-3.5" />Local News
          </TabsTrigger>
          <TabsTrigger value="iowa" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-slate-700">
            <Building2 className="w-3.5 h-3.5" />Iowa Gov
          </TabsTrigger>
          <TabsTrigger value="federal" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-slate-700">
            <FileText className="w-3.5 h-3.5" />Fed Reg
          </TabsTrigger>
          <TabsTrigger value="grants" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-slate-700">
            <DollarSign className="w-3.5 h-3.5" />Grants
          </TabsTrigger>
          <TabsTrigger value="census" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-slate-700">
            <Users className="w-3.5 h-3.5" />Census
          </TabsTrigger>
          <TabsTrigger value="bls" className="flex flex-col items-center gap-0.5 py-2 text-[10px] data-[state=active]:bg-slate-700">
            <TrendingUp className="w-3.5 h-3.5" />BLS
          </TabsTrigger>
        </TabsList>

        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
          <TabsContent value="social" className="mt-0"><SocialTab /></TabsContent>
          <TabsContent value="news" className="mt-0"><LocalNewsTab /></TabsContent>
          <TabsContent value="iowa" className="mt-0"><IowaGovTab /></TabsContent>
          <TabsContent value="federal" className="mt-0"><FederalRegTab /></TabsContent>
          <TabsContent value="grants" className="mt-0"><GrantsTab /></TabsContent>
          <TabsContent value="census" className="mt-0"><CensusTab /></TabsContent>
          <TabsContent value="bls" className="mt-0"><BlsTab /></TabsContent>
        </div>
      </Tabs>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
        <span>Data cached server-side for 5 minutes. Census and BLS data cached for 1 hour.</span>
        <a href="https://www.federalregister.gov/developers/documentation/api/v1" target="_blank" rel="noopener noreferrer"
          className="hover:text-slate-300 flex items-center gap-1">
          API Documentation <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
