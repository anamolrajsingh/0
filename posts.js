/* ================================================================
   posts.js — Blog CMS (Markdown-based)
   --------------------------------------------------------------
   HOW TO ADD A NEW POST:
   1. Copy the template object below
   2. Fill in: slug, title, excerpt, date, tag, content (markdown)
   3. Add it to the POSTS array
   4. Push to GitHub — it appears instantly

   Supported markdown: ## headings, **bold**, *italic*,
   `inline code`, ```code blocks```, [links](url), - lists, paragraphs
   ================================================================ */

const POSTS = [
    {
        slug: "on-learning-in-public",
        title: "On Learning in Public",
        excerpt: "Why I started writing down what I don't fully understand yet — and what happens when you stop waiting to have something polished to say.",
        date: "2026-08-01",
        tag: "Philosophy",
        content: `
## The problem with waiting

I've always thought I needed to *understand* something before I could write about it. That feels responsible — you don't want to put half-formed ideas into the world. But here's what actually happens: you never feel ready. The idea sits in a notebook, matures in your head, and then quietly dies there.

So I'm trying something different.

## What "learning in public" means to me

It doesn't mean performing intelligence. It means being honest about where I am in the process — confused, curious, halfway there. Writing not from a position of authority but from a position of *attention*.

> I'm not explaining. I'm thinking out loud, and hoping someone else's thoughts bounce off mine.

## What I've noticed so far

A few things:

- Writing forces precision. Things that feel clear in my head get fuzzy when I try to say them.
- Putting ideas out there invites conversation — and conversation is where real learning happens.
- The fear of being wrong is way bigger than the actual cost of being wrong.

I don't know where this goes. But I'd rather find out than keep waiting.
        `.trim()
    },
    {
        slug: "the-interface-is-the-argument",
        title: "The Interface Is the Argument",
        excerpt: "Every design choice is a philosophical position. A button's color, a menu's structure, a loading spinner — they're all saying something about what the designer thinks you should value.",
        date: "2026-07-22",
        tag: "Design",
        content: `
## Software has opinions

When an app hides its settings, it's saying: "you don't need to think about this." When it gives you twelve toggles, it's saying: "this is yours to configure." Neither is neutral.

I started noticing this everywhere once I started looking.

## A few examples

**Instagram** crops every photo to a square. That's a design decision, but it's also an argument: *the composition should fit the feed, not the photographer's vision.* It changed how a generation frames photos.

**iA Writer** uses a monospace font and a single column with no styling options. The argument: *your writing doesn't need decoration. It needs focus.* The constraint is the feature.

**Terminal** apps give you nothing — a cursor and a prompt. The argument: *you already know what you want to do, just say it.* It's the most honest interface there is.

## Why this matters

Because design isn't decoration. It's a set of assumptions about who the user is, what they want, and how they think. When you notice the argument, you start seeing the values underneath the software.

That's why I care about design — not because I like pretty things, but because the way something is shaped tells you what its maker believed.
        `.trim()
    },
    {
        slug: "reading-as-a-practice-not-a-habit",
        title: "Reading as a Practice, Not a Habit",
        excerpt: "There's a difference between reading because it's a habit and reading because it's a practice. One is about quantity. The other is about transformation.",
        date: "2026-07-10",
        tag: "Reading & Ideas",
        content: `
## The habit trap

I tracked my reading for a while — books per year, pages per day, minutes per session. It felt productive. But at some point I realized I was reading to *check a box*, not to actually think.

The numbers went up. The understanding didn't.

## Practice vs. habit

A habit is something you do automatically. A practice is something you do *intentionally*. The difference shows up in how you engage:

- A habit reader finishes books. A practice reader stops when something hits hard and sits with it.
- A habit reader moves to the next book immediately. A practice reader writes about what they read, argues with it, lets it change something.
- A habit reader remembers the title. A practice reader remembers the sentence that mattered.

## What I'm trying now

I've stopped tracking quantity. Instead, after each book I ask myself one question: *what did this change?*

Sometimes the answer is "nothing yet" and that's okay. Not every book needs to be transformative. But asking the question keeps me honest about whether I'm actually reading or just consuming.

Right now I'm reading slowly through *The Beginning of Infinity* by David Deutsch. It's dense in the best way — every few pages I have to stop and reconsider something I thought I understood.
        `.trim()
    },
    {
        slug: "what-technology-actually-is",
        title: "What Technology Actually Is",
        excerpt: "We tend to think of technology as gadgets and software. But that's like thinking literature is just books. Technology is really about extending human capability — and it's much older than we think.",
        date: "2026-06-28",
        tag: "Technology",
        content: `
## A wider definition

Kevin Kelly has this idea that technology is the *seventh kingdom of life*. Not because gadgets are alive, but because technology evolves the same way organisms do — through variation, selection, and adaptation.

I think about this a lot.

## The printing press was a technology

So was agriculture. So was writing itself. The wheel, the lever, the compass — these were the *platform technologies* of their time, just like the internet is ours.

When we say "technology" today, we usually mean *computers*. But that's a category error. A hammer is technology. A language is technology. A system of laws is technology.

## Why this framing matters

If you only think of technology as *new software*, you miss most of the story. The interesting question isn't "what new app should I use" — it's "what capability is being extended, and what does that change about how we live?"

\`\`\`
The tool is not the technology.
The capability is the technology.
The tool is just the interface.
\`\`\`

That's why I'm drawn to understanding systems — not just how to use them, but what they *do* to us once we start using them.
        `.trim()
    },
    {
        slug: "films-that-listen",
        title: "Films That Listen",
        excerpt: "The best films don't just show you something — they listen to you watching them. They leave space for your reaction instead of dictating it.",
        date: "2026-06-15",
        tag: "Film & Media",
        content: `
## Two kinds of films

There are films that tell you what to feel and films that create a space for you to feel something. The first kind is easy to watch. The second kind is the one that stays with you.

I've been thinking about the difference.

## The architecture of silence

A film like *Tokyo Story* by Ozu barely moves its camera. It doesn't underscore emotions with swelling music. It just... shows you people. And in the silence between them, you bring your own grief, your own love, your own regret.

That's a design choice. Ozu *chose* to leave space. He trusted the audience more than most directors trust themselves.

## What this teaches me about everything

Good communication — whether it's a film, an essay, or a conversation — knows when to stop talking. The impulse to fill every moment with explanation is the impulse to control. And control kills connection.

I think about this when I write, too. The white space between paragraphs isn't waste. It's where the reader does their work.
        `.trim()
    },
    {
        slug: "the-news-is-not-the-world",
        title: "The News Is Not the World",
        excerpt: "The news shows us what's exceptional, not what's normal. That's its job — but if you confuse the two, you end up with a distorted map of reality.",
        date: "2026-06-03",
        tag: "Current Affairs",
        content: `
## What news is for

News is designed to surface *what changed today*. That's a useful function — you need to know about the earthquake, not about the 7 billion days that went normally.

But the structure of news creates a side effect: if you consume enough of it, you start to believe the world is only made of exceptions.

## The asymmetry

Bad news is *information*. Good news is *no news*. A city that didn't have a riot, a vaccine that worked, a bridge that held — none of these make headlines. But they're the actual story of human progress.

This means your news feed is not a mirror of reality. It's a *filter* that lets through everything that went wrong and blocks everything that went right.

## What I'm trying to do

I'm not saying ignore the news. I'm saying *contextualize* it. When I read a headline that makes the world feel like it's falling apart, I try to remember: this is news *because* it's unusual. The normal stuff — people helping each other, systems working, slow progress — doesn't get reported.

The world is always both. The news only shows you one side.
        `.trim()
    }
];

// ===== EXPORT FOR USE IN OTHER FILES =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = POSTS;
}
