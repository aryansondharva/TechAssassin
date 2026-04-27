import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  Bookmark,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Code2,
  Compass,
  ExternalLink,
  FileText,
  Flame,
  GitPullRequest,
  Github,
  GraduationCap,
  Hash,
  Heart,
  Home,
  Image,
  Languages,
  MessageCircle,
  MessagesSquare,
  Paperclip,
  PlusCircle,
  Repeat2,
  Save,
  Search,
  Send,
  Share2,
  Sparkles,
  Sword,
  Timer,
  Trophy,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SignInButton, SignUpButton, useUser } from "@clerk/react";

type PostType =
  | "Notes"
  | "Doubt"
  | "Code"
  | "Question Paper"
  | "Project"
  | "Open Source"
  | "Competitive Coding";

type FeedView = "Home" | "Explore" | "Notes" | "Coding" | "Doubts" | "Open Source" | "Leaderboard" | "Saved";
type AiMode = "summary" | "marks" | "translate" | "viva";

interface FeedAuthor {
  name: string;
  handle: string;
  college: string;
  badge: string;
  avatar: string;
}

interface StudyComment {
  id: number;
  author: string;
  text: string;
  time: string;
}

interface StudyPost {
  id: number;
  author: FeedAuthor;
  type: PostType;
  subject: string;
  title: string;
  body: string;
  code?: string;
  attachment?: {
    kind: "Image" | "PDF" | "Repo";
    label: string;
    meta: string;
  };
  tags: string[];
  createdAt: string;
  stats: {
    likes: number;
    comments: number;
    reposts: number;
    saves: number;
  };
  liked: boolean;
  saved: boolean;
  comments: StudyComment[];
}

const postTypes: PostType[] = [
  "Notes",
  "Doubt",
  "Code",
  "Question Paper",
  "Project",
  "Open Source",
  "Competitive Coding",
];

const navItems: Array<{ label: FeedView | "Profile"; icon: typeof Home }> = [
  { label: "Home", icon: Home },
  { label: "Explore", icon: Compass },
  { label: "Notes", icon: BookOpen },
  { label: "Coding", icon: Code2 },
  { label: "Doubts", icon: MessagesSquare },
  { label: "Open Source", icon: GitPullRequest },
  { label: "Leaderboard", icon: Trophy },
  { label: "Profile", icon: User },
  { label: "Saved", icon: Bookmark },
];

const subjectFilters = ["All", "C Programming", "DBMS", "DSA", "Web Dev", "GTU Exams", "Open Source"];

const initialPosts: StudyPost[] = [
  {
    id: 1,
    author: {
      name: "Maitri Patel",
      handle: "maitri.codes",
      college: "LD College of Engineering",
      badge: "GTU Helper",
      avatar: "MP",
    },
    type: "Notes",
    subject: "C Programming",
    title: "Pointer in C explained in simple way for GTU 7 marks.",
    body:
      "A pointer stores the address of another variable. Use & to get an address and * to access the value at that address. In exams, explain declaration, initialization, dereferencing, and one small code example.",
    code: "int marks = 88;\nint *ptr = &marks;\nprintf(\"%d\", *ptr);",
    tags: ["CProgramming", "GTU", "Exam"],
    createdAt: "12 min",
    stats: { likes: 128, comments: 18, reposts: 12, saves: 46 },
    liked: false,
    saved: false,
    comments: [
      { id: 1, author: "Dev Shah", text: "This format is perfect for 7 marks.", time: "8 min" },
      { id: 2, author: "Nisha J", text: "Add pointer arithmetic too?", time: "4 min" },
    ],
  },
  {
    id: 2,
    author: {
      name: "Rudra Mehta",
      handle: "rudra.debugs",
      college: "VGEC Ahmedabad",
      badge: "Debug Assassin",
      avatar: "RM",
    },
    type: "Doubt",
    subject: "C Programming",
    title: "Why is pointer used in C when variables already store values?",
    body:
      "I understand that pointer stores address, but I am confused about practical use. Is it only for arrays and functions, or does it help in memory management too?",
    tags: ["Doubt", "Pointers", "C"],
    createdAt: "29 min",
    stats: { likes: 41, comments: 11, reposts: 3, saves: 22 },
    liked: true,
    saved: false,
    comments: [
      { id: 1, author: "Aarav S", text: "Use pointers when you need to modify original data from another function.", time: "18 min" },
    ],
  },
  {
    id: 3,
    author: {
      name: "Hetvi Lad",
      handle: "hetvi.builds",
      college: "GEC Rajkot",
      badge: "Coder",
      avatar: "HL",
    },
    type: "Code",
    subject: "DSA",
    title: "State compression pattern for competitive coding DP.",
    body:
      "When the current row depends only on the previous row, reduce a 2D DP table into two arrays. It saves memory and keeps the transition clean.",
    code:
      "vector<int> prev(n + 1), cur(n + 1);\nfor (int i = 1; i <= m; i++) {\n  for (int j = 1; j <= n; j++) {\n    cur[j] = max(prev[j], cur[j - 1]);\n  }\n  prev = cur;\n}",
    tags: ["DSA", "DynamicProgramming", "Code"],
    createdAt: "1 hr",
    stats: { likes: 214, comments: 34, reposts: 28, saves: 91 },
    liked: false,
    saved: true,
    comments: [
      { id: 1, author: "Parth V", text: "This helped me solve LCS memory limit.", time: "44 min" },
    ],
  },
  {
    id: 4,
    author: {
      name: "Aryan Sondharva",
      handle: "aryan.oss",
      college: "TechAssassin Community",
      badge: "Contributor",
      avatar: "AS",
    },
    type: "Open Source",
    subject: "Open Source",
    title: "Good first issue: improve event dashboard empty states.",
    body:
      "Looking for a frontend contributor to add clear empty states for events, projects, and notifications. Good issue for learning React, Tailwind, and component polish.",
    attachment: {
      kind: "Repo",
      label: "techassassin/community",
      meta: "React + Supabase issue",
    },
    tags: ["OpenSource", "React", "GoodFirstIssue"],
    createdAt: "2 hr",
    stats: { likes: 96, comments: 9, reposts: 16, saves: 39 },
    liked: false,
    saved: false,
    comments: [
      { id: 1, author: "Dhruvi M", text: "Can I take the notifications part?", time: "1 hr" },
    ],
  },
  {
    id: 5,
    author: {
      name: "Krish Solanki",
      handle: "krish.gtu",
      college: "BVM Engineering College",
      badge: "Topper",
      avatar: "KS",
    },
    type: "Question Paper",
    subject: "GTU Exams",
    title: "DBMS summer paper: repeated normalization questions.",
    body:
      "BCNF vs 3NF appeared again. Prepare definitions, dependency diagram, decomposition steps, and one example relation with keys.",
    attachment: {
      kind: "PDF",
      label: "DBMS-Summer-Important.pdf",
      meta: "8 pages",
    },
    tags: ["DBMS", "GTU", "QuestionPaper"],
    createdAt: "3 hr",
    stats: { likes: 172, comments: 26, reposts: 19, saves: 118 },
    liked: false,
    saved: false,
    comments: [
      { id: 1, author: "Jainam P", text: "Please add transaction management section too.", time: "2 hr" },
    ],
  },
];

const trendingTopics = [
  { tag: "GTU 7 marks answers", count: "2.4k posts" },
  { tag: "C pointers", count: "1.8k posts" },
  { tag: "React projects", count: "940 posts" },
  { tag: "DBMS normalization", count: "780 posts" },
];

const topContributors = [
  { name: "Maitri Patel", points: 2460, badge: "GTU Helper" },
  { name: "Hetvi Lad", points: 2215, badge: "Coder" },
  { name: "Aryan Sondharva", points: 1980, badge: "Contributor" },
];

const openSourceProjects = [
  { name: "Campus notes API", stack: "Node + Supabase", issues: 6 },
  { name: "GTU paper parser", stack: "Python", issues: 4 },
  { name: "Study timer widget", stack: "React", issues: 3 },
];

const typeColor: Record<PostType, string> = {
  Notes: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  Doubt: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  Code: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  "Question Paper": "border-violet-400/25 bg-violet-400/10 text-violet-200",
  Project: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
  "Open Source": "border-lime-400/25 bg-lime-400/10 text-lime-200",
  "Competitive Coding": "border-rose-400/25 bg-rose-400/10 text-rose-200",
};

function normalizeTags(input: string) {
  return input
    .split(/[,\s]+/)
    .map((tag) => tag.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function getAiText(post: StudyPost, mode: AiMode) {
  if (mode === "marks") {
    return `7 marks answer: Define ${post.subject}, explain the core idea, add one diagram or code example, then close with two practical uses. For this post, start with "${post.title}" and use the tags ${post.tags.join(", ")} as sub-points.`;
  }

  if (mode === "translate") {
    return `Gujarati/Hindi friendly version: ${post.body} Key terms should stay in English: ${post.tags.join(", ")}. Explain each term with one short local-language sentence during revision.`;
  }

  if (mode === "viva") {
    return `Viva questions: 1. What is the main concept in this post? 2. Where would you use it in a real program or exam answer? 3. What mistake do beginners make here? 4. Can you explain ${post.tags[0] || post.subject} with a small example?`;
  }

  if (post.type === "Code" || post.code) {
    return `Code explanation: Identify the variables first, trace one loop or statement, then explain the output. This snippet is mainly about ${post.subject}, and the most important revision point is ${post.tags[0] || "the core pattern"}.`;
  }

  return `Quick summary: ${post.body} Remember it as ${post.tags.slice(0, 2).join(" + ") || post.subject}, then prepare one definition, one example, and one exam-style use case.`;
}

function getTypeIcon(type: PostType) {
  if (type === "Code" || type === "Competitive Coding") return Code2;
  if (type === "Doubt") return MessagesSquare;
  if (type === "Open Source") return GitPullRequest;
  if (type === "Question Paper") return FileText;
  return BookOpen;
}

const AssassinFeed = () => {
  const { user, isSignedIn } = useUser();
  const [posts, setPosts] = useState<StudyPost[]>(initialPosts);
  const [activeView, setActiveView] = useState<FeedView>("Home");
  const [activeSubject, setActiveSubject] = useState("All");
  const [assassinMode, setAssassinMode] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPostType, setSelectedPostType] = useState<PostType>("Notes");
  const [composerText, setComposerText] = useState("");
  const [composerTags, setComposerTags] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [aiPanels, setAiPanels] = useState<Record<number, AiMode>>({});

  const currentAuthor: FeedAuthor = {
    name: user?.fullName || user?.username || "Guest Student",
    handle: user?.username || "guest.assassin",
    college: "TechAssassin Community",
    badge: isSignedIn ? "Member" : "Visitor",
    avatar:
      user?.firstName?.[0]?.toUpperCase() ||
      user?.username?.[0]?.toUpperCase() ||
      "TA",
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const viewMatch =
        activeView === "Home" ||
        activeView === "Explore" ||
        (activeView === "Notes" && post.type === "Notes") ||
        (activeView === "Coding" && ["Code", "Competitive Coding", "Project"].includes(post.type)) ||
        (activeView === "Doubts" && post.type === "Doubt") ||
        (activeView === "Open Source" && post.type === "Open Source") ||
        (activeView === "Saved" && post.saved);

      const subjectMatch = activeSubject === "All" || post.subject === activeSubject;
      const assassinMatch = !assassinMode || post.subject === activeSubject || activeSubject === "All";
      const queryMatch =
        query.trim().length === 0 ||
        `${post.title} ${post.body} ${post.tags.join(" ")} ${post.author.name}`
          .toLowerCase()
          .includes(query.toLowerCase());

      return viewMatch && subjectMatch && assassinMatch && queryMatch;
    });
  }, [activeSubject, activeView, assassinMode, posts, query]);

  const createPost = () => {
    const trimmed = composerText.trim();
    if (!trimmed) return;

    const tags = normalizeTags(composerTags);
    const newPost: StudyPost = {
      id: Date.now(),
      author: currentAuthor,
      type: selectedPostType,
      subject: activeSubject === "All" ? "GTU Exams" : activeSubject,
      title: trimmed.split("\n")[0].slice(0, 110),
      body: trimmed,
      code: selectedPostType === "Code" ? "Paste your final code here after connecting the editor." : undefined,
      tags: tags.length ? tags : [selectedPostType.replace(/\s/g, ""), "Study"],
      createdAt: "now",
      stats: { likes: 0, comments: 0, reposts: 0, saves: 0 },
      liked: false,
      saved: false,
      comments: [],
    };

    setPosts((current) => [newPost, ...current]);
    setComposerText("");
    setComposerTags("");
  };

  const updatePost = (postId: number, updater: (post: StudyPost) => StudyPost) => {
    setPosts((current) => current.map((post) => (post.id === postId ? updater(post) : post)));
  };

  const addComment = (postId: number) => {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;

    updatePost(postId, (post) => ({
      ...post,
      stats: { ...post.stats, comments: post.stats.comments + 1 },
      comments: [
        ...post.comments,
        {
          id: Date.now(),
          author: currentAuthor.name,
          text,
          time: "now",
        },
      ],
    }));

    setCommentDrafts((drafts) => ({ ...drafts, [postId]: "" }));
  };

  const renderMainContent = () => {
    if (activeView === "Leaderboard") {
      return <LeaderboardPanel />;
    }

    return (
      <>
        <Composer
          composerTags={composerTags}
          composerText={composerText}
          createPost={createPost}
          isSignedIn={isSignedIn}
          selectedPostType={selectedPostType}
          setComposerTags={setComposerTags}
          setComposerText={setComposerText}
          setSelectedPostType={setSelectedPostType}
        />

        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                aiMode={aiPanels[post.id]}
                commentDraft={commentDrafts[post.id] || ""}
                onAiModeChange={(mode) =>
                  setAiPanels((current) => ({
                    ...current,
                    [post.id]: current[post.id] === mode ? undefined : mode,
                  }))
                }
                onCommentDraftChange={(value) => setCommentDrafts((drafts) => ({ ...drafts, [post.id]: value }))}
                onCommentSubmit={() => addComment(post.id)}
                onLike={() =>
                  updatePost(post.id, (item) => ({
                    ...item,
                    liked: !item.liked,
                    stats: { ...item.stats, likes: item.stats.likes + (item.liked ? -1 : 1) },
                  }))
                }
                onRepost={() =>
                  updatePost(post.id, (item) => ({
                    ...item,
                    stats: { ...item.stats, reposts: item.stats.reposts + 1 },
                  }))
                }
                onSave={() =>
                  updatePost(post.id, (item) => ({
                    ...item,
                    saved: !item.saved,
                    stats: { ...item.stats, saves: item.stats.saves + (item.saved ? -1 : 1) },
                  }))
                }
                post={post}
              />
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-10 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-white/30" />
              <h2 className="text-lg font-black uppercase tracking-wide text-white">No posts found</h2>
              <p className="mt-2 text-sm text-white/45">Try another tag, subject, or feed section.</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-white">
      <div className="mx-auto grid w-full max-w-[1500px] gap-4 px-4 py-4 lg:grid-cols-[230px_minmax(0,710px)_330px] xl:gap-6">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <LeftSidebar activeView={activeView} setActiveView={setActiveView} />
        </aside>

        <main className="min-w-0 space-y-4">
          <MobileHeader activeView={activeView} setActiveView={setActiveView} />

          <section className="rounded-lg border border-white/10 bg-[#101116] p-4 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-red-300">
                  <Sword className="h-4 w-4" />
                  Assassin Feed
                </div>
                <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Study network for notes, code, doubts, and GTU prep
                </h1>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/25 p-1">
                <button
                  onClick={() => setAssassinMode((value) => !value)}
                  className={`flex h-10 items-center gap-2 rounded px-3 text-xs font-black uppercase tracking-wide transition ${
                    assassinMode ? "bg-red-600 text-white" : "text-white/55 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Timer className="h-4 w-4" />
                  Assassin Mode
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search notes, tags, doubts, code"
                  className="h-11 w-full rounded-md border border-white/10 bg-black/30 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/60"
                />
              </label>

              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {subjectFilters.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setActiveSubject(subject)}
                    className={`h-11 shrink-0 rounded-md border px-3 text-xs font-bold transition ${
                      activeSubject === subject
                        ? "border-red-500/50 bg-red-600 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {assassinMode && (
              <div className="mt-4 grid gap-3 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-50 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-red-200" />
                  Focus timer: 25:00
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-red-200" />
                  Next topic: normalization
                </div>
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-red-200" />
                  Practice: pointers quiz
                </div>
              </div>
            )}
          </section>

          {renderMainContent()}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1 scrollbar-hide">
          <ProfilePanel currentAuthor={currentAuthor} isSignedIn={isSignedIn} />
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
};

function LeftSidebar({
  activeView,
  setActiveView,
}: {
  activeView: FeedView;
  setActiveView: (view: FeedView) => void;
}) {
  return (
    <div className="hidden h-full rounded-lg border border-white/10 bg-[#101116] p-4 lg:flex lg:flex-col">
      <Link to="/" className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-600 text-white">
          <Sword className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-black uppercase leading-none tracking-wide">TechAssassin</div>
          <div className="mt-1 text-xs text-white/40">Study Feed</div>
        </div>
      </Link>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.label === "Profile") {
            return (
              <Link
                key={item.label}
                to="/profile"
                className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-bold text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          }

          const isActive = activeView === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setActiveView(item.label)}
              className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-bold transition ${
                isActive ? "bg-red-600 text-white" : "text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-md border border-white/10 bg-black/25 p-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/70">
          <Flame className="h-4 w-4 text-amber-300" />
          Streak
        </div>
        <div className="mt-3 text-3xl font-black">12</div>
        <div className="text-xs text-white/40">study days</div>
      </div>
    </div>
  );
}

function MobileHeader({
  activeView,
  setActiveView,
}: {
  activeView: FeedView;
  setActiveView: (view: FeedView) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#101116] p-3 lg:hidden">
      <div className="mb-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
          <Sword className="h-5 w-5 text-red-500" />
          TechAssassin
        </Link>
        <Bell className="h-5 w-5 text-white/50" />
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {navItems
          .filter((item) => item.label !== "Profile")
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveView(item.label as FeedView)}
                className={`flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-bold transition ${
                  isActive ? "bg-red-600 text-white" : "bg-white/[0.04] text-white/55"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
      </div>
    </div>
  );
}

function Composer({
  composerTags,
  composerText,
  createPost,
  isSignedIn,
  selectedPostType,
  setComposerTags,
  setComposerText,
  setSelectedPostType,
}: {
  composerTags: string;
  composerText: string;
  createPost: () => void;
  isSignedIn: boolean;
  selectedPostType: PostType;
  setComposerTags: (value: string) => void;
  setComposerText: (value: string) => void;
  setSelectedPostType: (value: PostType) => void;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#101116] p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {postTypes.map((type) => {
          const Icon = getTypeIcon(type);
          return (
            <button
              key={type}
              onClick={() => setSelectedPostType(type)}
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-bold transition ${
                selectedPostType === type
                  ? "border-red-500/60 bg-red-600 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {type}
            </button>
          );
        })}
      </div>

      <textarea
        value={composerText}
        onChange={(event) => setComposerText(event.target.value)}
        placeholder="Share notes, code, GTU answers, doubts, projects, or open-source issues"
        className="min-h-28 w-full resize-none rounded-md border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-red-500/60"
      />

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={composerTags}
            onChange={(event) => setComposerTags(event.target.value)}
            placeholder="Tags: CProgramming, GTU, Exam"
            className="h-10 w-full rounded-md border border-white/10 bg-black/30 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/60"
          />
        </label>

        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/55 transition hover:bg-white/10 hover:text-white">
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/55 transition hover:bg-white/10 hover:text-white">
            <Image className="h-4 w-4" />
          </button>
          <button
            onClick={createPost}
            disabled={!composerText.trim()}
            className="flex h-10 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <PlusCircle className="h-4 w-4" />
            Post
          </button>
        </div>
      </div>

      {!isSignedIn && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-50">
          <span className="font-medium">Posting as guest.</span>
          <SignInButton mode="modal">
            <button className="font-black uppercase tracking-wide text-amber-100 underline underline-offset-4">Login</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="font-black uppercase tracking-wide text-amber-100 underline underline-offset-4">Signup</button>
          </SignUpButton>
        </div>
      )}
    </section>
  );
}

function PostCard({
  aiMode,
  commentDraft,
  onAiModeChange,
  onCommentDraftChange,
  onCommentSubmit,
  onLike,
  onRepost,
  onSave,
  post,
}: {
  aiMode?: AiMode;
  commentDraft: string;
  onAiModeChange: (mode: AiMode) => void;
  onCommentDraftChange: (value: string) => void;
  onCommentSubmit: () => void;
  onLike: () => void;
  onRepost: () => void;
  onSave: () => void;
  post: StudyPost;
}) {
  const TypeIcon = getTypeIcon(post.type);

  return (
    <article className="rounded-lg border border-white/10 bg-[#101116] p-4">
      <div className="flex gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/10 bg-gradient-to-br from-red-600 to-[#20242c] text-sm font-black">
          {post.author.avatar}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black leading-tight text-white">{post.author.name}</h2>
                <span className="text-sm text-white/40">@{post.author.handle}</span>
                <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[11px] font-bold text-red-100">
                  {post.author.badge}
                </span>
              </div>
              <div className="mt-1 text-xs text-white/40">
                {post.author.college} | {post.createdAt}
              </div>
            </div>

            <span className={`inline-flex w-fit items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-bold ${typeColor[post.type]}`}>
              <TypeIcon className="h-3.5 w-3.5" />
              {post.type}
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-black leading-snug text-white">{post.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/68">{post.body}</p>
          </div>

          {post.code && (
            <pre className="mt-4 overflow-x-auto rounded-md border border-white/10 bg-black/45 p-4 text-sm leading-6 text-sky-100">
              <code>{post.code}</code>
            </pre>
          )}

          {post.attachment && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/30 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/10">
                  {post.attachment.kind === "Repo" ? <Github className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{post.attachment.label}</div>
                  <div className="text-xs text-white/40">{post.attachment.meta}</div>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-white/45" />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <button
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-bold text-white/55 transition hover:border-red-500/40 hover:text-white"
              >
                #{tag}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-y border-white/10 py-3 sm:grid-cols-5">
            <ActionButton active={post.liked} icon={Heart} label="Like" onClick={onLike} value={post.stats.likes} />
            <ActionButton icon={MessageCircle} label="Comment" value={post.stats.comments} />
            <ActionButton icon={Repeat2} label="Repost" onClick={onRepost} value={post.stats.reposts} />
            <ActionButton active={post.saved} icon={Save} label="Save" onClick={onSave} value={post.stats.saves} />
            <ActionButton icon={Share2} label="Share" />
          </div>

          <div className="mt-4 rounded-md border border-white/10 bg-black/25">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3">
              <button
                onClick={() => onAiModeChange("summary")}
                className="flex h-9 items-center gap-2 rounded-md bg-white text-black px-3 text-xs font-black uppercase tracking-wide transition hover:bg-white/90"
              >
                <Sparkles className="h-4 w-4" />
                Explain this
              </button>
              <div className="flex flex-wrap gap-2">
                <AiModeButton active={aiMode === "marks"} icon={GraduationCap} label="7 marks" onClick={() => onAiModeChange("marks")} />
                <AiModeButton active={aiMode === "translate"} icon={Languages} label="Gujarati/Hindi" onClick={() => onAiModeChange("translate")} />
                <AiModeButton active={aiMode === "viva"} icon={Brain} label="Viva" onClick={() => onAiModeChange("viva")} />
              </div>
            </div>

            {aiMode && (
              <div className="p-3 text-sm leading-6 text-white/70">
                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-red-200">
                  <Sparkles className="h-4 w-4" />
                  AI Study Helper
                </div>
                {getAiText(post, aiMode)}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {post.comments.slice(0, 3).map((comment) => (
              <div key={comment.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-bold text-white">{comment.author}</span>
                  <span className="text-white/35">{comment.time}</span>
                </div>
                <p className="text-sm leading-5 text-white/65">{comment.text}</p>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                value={commentDraft}
                onChange={(event) => onCommentDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onCommentSubmit();
                }}
                placeholder="Reply with explanation, code, or exam tip"
                className="h-10 min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/60"
              />
              <button
                onClick={onCommentSubmit}
                className="flex h-10 w-10 items-center justify-center rounded-md bg-red-600 text-white transition hover:bg-red-500"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  active = false,
  icon: Icon,
  label,
  onClick,
  value,
}: {
  active?: boolean;
  icon: typeof Heart;
  label: string;
  onClick?: () => void;
  value?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-10 items-center justify-center gap-2 rounded-md text-xs font-bold transition ${
        active ? "bg-red-600/15 text-red-200" : "text-white/50 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className={`h-4 w-4 ${active && label === "Like" ? "fill-current" : ""}`} />
      <span>{label}</span>
      {typeof value === "number" && <span className="text-white/35">{value}</span>}
    </button>
  );
}

function AiModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Brain;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-bold transition ${
        active
          ? "border-red-500/50 bg-red-600 text-white"
          : "border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ProfilePanel({ currentAuthor, isSignedIn }: { currentAuthor: FeedAuthor; isSignedIn: boolean }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#101116] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-red-600 text-sm font-black">
          {currentAuthor.avatar}
        </div>
        <div className="min-w-0">
          <div className="truncate font-black text-white">{currentAuthor.name}</div>
          <div className="truncate text-sm text-white/40">@{currentAuthor.handle}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-white/[0.04] p-2">
          <div className="font-black">870</div>
          <div className="text-[11px] text-white/40">points</div>
        </div>
        <div className="rounded-md bg-white/[0.04] p-2">
          <div className="font-black">24</div>
          <div className="text-[11px] text-white/40">posts</div>
        </div>
        <div className="rounded-md bg-white/[0.04] p-2">
          <div className="font-black">9</div>
          <div className="text-[11px] text-white/40">badges</div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <ReputationItem label="Posting notes" points="+10" />
        <ReputationItem label="Answering doubt" points="+15" />
        <ReputationItem label="Getting saved" points="+5" />
        <ReputationItem label="Open-source contribution" points="+25" />
      </div>

      <div className="mt-4 flex gap-2">
        {isSignedIn ? (
          <Link
            to="/profile"
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-white text-sm font-black uppercase tracking-wide text-black transition hover:bg-white/90"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
        ) : (
          <>
            <SignInButton mode="modal">
              <button className="h-10 flex-1 rounded-md border border-white/10 bg-white/[0.03] text-sm font-black uppercase tracking-wide text-white">
                Login
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="h-10 flex-1 rounded-md bg-red-600 text-sm font-black uppercase tracking-wide text-white">
                Signup
              </button>
            </SignUpButton>
          </>
        )}
      </div>
    </section>
  );
}

function ReputationItem({ label, points }: { label: string; points: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/25 px-3 py-2">
      <span className="text-white/60">{label}</span>
      <span className="font-black text-emerald-200">{points}</span>
    </div>
  );
}

function RightSidebar() {
  return (
    <>
      <Widget title="Trending Topics" icon={Flame}>
        <div className="space-y-3">
          {trendingTopics.map((topic) => (
            <button key={topic.tag} className="flex w-full items-center justify-between gap-3 text-left">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-white">#{topic.tag}</div>
                <div className="text-xs text-white/40">{topic.count}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/30" />
            </button>
          ))}
        </div>
      </Widget>

      <Widget title="Upcoming GTU Exams" icon={CalendarDays}>
        <div className="space-y-3 text-sm">
          <ExamRow subject="DBMS" date="May 06" weight="High" />
          <ExamRow subject="Operating System" date="May 10" weight="Medium" />
          <ExamRow subject="Computer Networks" date="May 14" weight="High" />
        </div>
      </Widget>

      <Widget title="Top Contributors" icon={Trophy}>
        <div className="space-y-3">
          {topContributors.map((contributor, index) => (
            <div key={contributor.name} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06] text-sm font-black">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{contributor.name}</div>
                <div className="truncate text-xs text-white/40">{contributor.badge}</div>
              </div>
              <div className="text-sm font-black text-amber-200">{contributor.points}</div>
            </div>
          ))}
        </div>
      </Widget>

      <Widget title="Daily Coding Challenge" icon={Code2}>
        <div className="rounded-md border border-sky-400/20 bg-sky-400/10 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-sky-100">
            <CheckCircle2 className="h-4 w-4" />
            Two Sum Variant
          </div>
          <p className="text-sm leading-5 text-white/65">Return indices after sorting without losing original position.</p>
          <button className="mt-3 flex h-9 items-center gap-2 rounded-md bg-sky-400 px-3 text-xs font-black uppercase tracking-wide text-slate-950">
            Practice
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Widget>

      <Widget title="Open Source Projects" icon={Github}>
        <div className="space-y-3">
          {openSourceProjects.map((project) => (
            <div key={project.name} className="rounded-md border border-white/10 bg-black/25 p-3">
              <div className="font-bold text-white">{project.name}</div>
              <div className="mt-1 text-xs text-white/40">{project.stack}</div>
              <div className="mt-3 text-xs font-black uppercase tracking-wide text-lime-200">{project.issues} open issues</div>
            </div>
          ))}
        </div>
      </Widget>
    </>
  );
}

function Widget({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof Flame;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#101116] p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">
        <Icon className="h-4 w-4 text-red-300" />
        {title}
      </div>
      {children}
    </section>
  );
}

function ExamRow({ date, subject, weight }: { date: string; subject: string; weight: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/25 px-3 py-2">
      <div>
        <div className="font-bold text-white">{subject}</div>
        <div className="text-xs text-white/40">{date}</div>
      </div>
      <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-red-100">
        {weight}
      </span>
    </div>
  );
}

function LeaderboardPanel() {
  return (
    <section className="rounded-lg border border-white/10 bg-[#101116] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Reputation Leaderboard</h2>
          <p className="mt-1 text-sm text-white/45">Points from notes, doubt answers, saves, and open-source work.</p>
        </div>
        <Trophy className="h-8 w-8 text-amber-200" />
      </div>

      <div className="space-y-3">
        {topContributors.map((contributor, index) => (
          <div key={contributor.name} className="flex items-center gap-3 rounded-md border border-white/10 bg-black/25 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-red-600 text-lg font-black">{index + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-black text-white">{contributor.name}</div>
              <div className="text-sm text-white/40">{contributor.badge}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-amber-200">{contributor.points}</div>
              <div className="text-xs text-white/35">points</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AssassinFeed;
