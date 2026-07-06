import { GoogleGenAI } from "@google/genai";

export interface QuestionBankItem {
  id: string;
  role: string; // 'Software Engineer' | 'Product Manager' | 'Data Analyst' | 'Sales Representative' | 'All'
  question_text: string;
  question_type: "behavioral" | "technical";
  difficulty: "easy" | "medium" | "hard";
  model_answer: string; // Used for RAG grounding and grader guidance
}

// 50 high-quality interview questions
export const QUESTION_BANK: QuestionBankItem[] = [
  // --- SOFTWARE ENGINEER ---
  {
    id: "swe-b1",
    role: "Software Engineer",
    question_text: "Describe a time when you had to debug a complex production issue under tight time constraints. What was your process, and what did you learn?",
    question_type: "behavioral",
    difficulty: "medium",
    model_answer: "Situation: Our checkout system crashed during Black Friday, losing $10k/min. Task: Identify and fix the bug immediately. Action: I isolated the issue by examining server logs in Datadog, traced it to a database deadlock under high concurrency, applied a temporary hotfix to serialize write queries, and subsequently deployed an optimistic locking mechanism. Result: The system was recovered in 12 minutes, and the locking fix permanently eliminated database deadlocks. Learnings: Implement proactive load testing before high-traffic events.",
  },
  {
    id: "swe-b2",
    role: "Software Engineer",
    question_text: "Tell me about a time you had a strong technical disagreement with a peer or senior engineer. How did you handle it and what was the outcome?",
    question_type: "behavioral",
    difficulty: "medium",
    model_answer: "Situation: Designing a real-time messaging sync service. Peer wanted to use polling, I advocated WebSockets. Task: Resolve the design conflict constructively. Action: I created a simple performance benchmark comparing latency and CPU overhead of WebSockets vs polling for 1,000 concurrent users. Presenting the concrete data objectively, rather than arguing opinions, helped build consensus. Result: Peer agreed WebSockets was the superior technical choice. Learnings: Data-driven decision making minimizes emotional friction in technical teams.",
  },
  {
    id: "swe-b3",
    role: "Software Engineer",
    question_text: "How do you keep up with emerging technologies and decide when to adopt a new library or tool in an existing codebase?",
    question_type: "behavioral",
    difficulty: "easy",
    model_answer: "I follow tech blogs, newsletters (like TLDR), and GitHub trending repos. Before adopting, I assess the problem it solves, library maintenance status, community size, and standard security audits. I prototype it in a sandbox first, comparing development speed, bundlesize, and long-term maintenance costs.",
  },
  {
    id: "swe-b4",
    role: "Software Engineer",
    question_text: "Tell me about a project that failed or didn't meet expectations. What went wrong, and how did you pivot?",
    question_type: "behavioral",
    difficulty: "hard",
    model_answer: "Situation: Built a serverless analytics dashboard. Task: Handle massive data ingestion. Action: The lambdas timed out due to high-volume cold starts and database connection limits. I pivoted by refactoring the ingestion layer to use AWS Kinesis for queuing and writing to DynamoDB instead of RDS. Result: Solved the timeouts, but cost exceeded budget. Learned to do deep cost estimation and resource modeling early in design.",
  },
  {
    id: "swe-t1",
    role: "Software Engineer",
    question_text: "What are the key trade-offs between SQL (relational) and NoSQL databases? In what scenario would you choose MongoDB over PostgreSQL?",
    question_type: "technical",
    difficulty: "easy",
    model_answer: "SQL offers strict schemas, ACID compliance, and robust complex query capabilities, making it ideal for structured data like transactions. NoSQL offers horizontal scalability, schema flexibility, and high write speeds. I would choose MongoDB over PostgreSQL for highly unstructured, rapidly changing document structures like content management or real-time user activity logging where schema changes occur daily and ACID transactions aren't critical.",
  },
  {
    id: "swe-t2",
    role: "Software Engineer",
    question_text: "Explain the concept of 'Eventual Consistency' and how it differs from 'Strong Consistency' in distributed systems. How does it affect system design?",
    question_type: "technical",
    difficulty: "hard",
    model_answer: "Strong Consistency guarantees that any read operation gets the value of the latest write (e.g., via synchronous replication). Eventual Consistency guarantees that all replicas will eventually have the latest value, but reads in the interim might return stale data (asynchronous replication). It affects system design by requiring developer support for stale reads, read-your-writes consistency strategies, or conflict-resolution algorithms (CRDTs).",
  },
  {
    id: "swe-t3",
    role: "Software Engineer",
    question_text: "Explain the event loop in Node.js. How does it handle asynchronous I/O operations without blocking the main thread?",
    question_type: "technical",
    difficulty: "medium",
    model_answer: "Node.js runs on a single main execution thread. Asynchronous I/O operations (like file reads, network requests) are delegated to the system kernel or Node's thread pool (libuv). When the I/O operation completes, a callback is queued. The Event Loop continuously checks the call stack; once empty, it processes callbacks in phases (timers, I/O callbacks, poll, check, close callbacks), keeping execution non-blocking.",
  },
  {
    id: "swe-t4",
    role: "Software Engineer",
    question_text: "How do you optimize the performance of a high-traffic web application? Focus on database, caching, and frontend assets.",
    question_type: "technical",
    difficulty: "medium",
    model_answer: "Database: Index common query columns, optimize slow SQL queries, use read replicas. Caching: Use Redis for database queries, session state, and API responses; implement CDN caching for static assets. Frontend: Minimize bundle size via tree shaking/code splitting, compress images, use lazy loading for images and components.",
  },
  {
    id: "swe-t5",
    role: "Software Engineer",
    question_text: "Describe how you would design a secure authentication system for a public REST API. What protocols, tokens, and storage mechanisms would you use?",
    question_type: "technical",
    difficulty: "hard",
    model_answer: "I would use OAuth 2.0 with JWT (JSON Web Tokens). Access tokens should be short-lived (15m) and refreshed via secure HttpOnly, SameSite cookies. Passwords must be hashed using bcrypt or Argon2 with a high salt cost. API requests must be rate-limited, use HTTPS, and implement robust CORS configurations.",
  },

  // --- PRODUCT MANAGER ---
  {
    id: "pm-b1",
    role: "Product Manager",
    question_text: "Describe a situation where you had to say 'no' to an important stakeholder or customer request. How did you handle the communication and alignment?",
    question_type: "behavioral",
    difficulty: "medium",
    model_answer: "Situation: A major client demanded a custom billing feature. Task: Maintain focus on core product roadmap. Action: I met with the stakeholder, showed them the roadmap showing features that directly impact 80% of our user base, and explained that building their custom feature would delay critical features by 3 months. I proposed a generic workaround. Result: Stakeholder accepted the explanation and felt respected. Learnings: Frame rejection around business goals and data, not personal bias.",
  },
  {
    id: "pm-b2",
    role: "Product Manager",
    question_text: "Tell me about a product or feature launch that failed to hit its target metrics. What did you learn and how did you pivot?",
    question_type: "behavioral",
    difficulty: "hard",
    model_answer: "Situation: Launched a referral program. Task: Drive viral growth by 20%. Action: The conversion rate was only 2%. I ran user interviews and realized the flow was too complicated (5 steps). We pivoted by simplifying the referral share to a 1-click WhatsApp button and increased rewards. Result: Referral conversion increased to 18%. Learned that UX simplicity beats reward size.",
  },
  {
    id: "pm-b3",
    role: "Product Manager",
    question_text: "How do you prioritize your product backlog when there are competing demands from engineering, sales, and design?",
    question_type: "behavioral",
    difficulty: "easy",
    model_answer: "I use a structured framework like RICE (Reach, Impact, Confidence, Effort) to assign numeric values to items. I balance engineering tech debt, sales-driven requests, and user experience enhancements by dedicating percentage allocations in every sprint (e.g., 60% core roadmap, 20% technical debt, 20% growth/sales requests).",
  },
  {
    id: "pm-t1",
    role: "Product Manager",
    question_text: "We want to launch a food delivery app specifically for corporate offices. How would you determine the MVP (Minimum Viable Product) features?",
    question_type: "technical",
    difficulty: "medium",
    model_answer: "Define target audience: Busy office workers. MVP Core Value: Seamless group ordering and bulk delivery. Crucial MVP Features: Simple calendar menu (1 option per day to keep operations lean), joint Slack ordering, and single scheduled daily office delivery. Exclude: Real-time map tracking, reviews, custom modifications. These are secondary to the core value.",
  },
  {
    id: "pm-t2",
    role: "Product Manager",
    question_text: "What metrics would you track to measure the health and success of a SaaS collaboration tool like Slack or Microsoft Teams?",
    question_type: "technical",
    difficulty: "easy",
    model_answer: "North Star: Daily Active Users sending at least 10 messages (DAU/MAU engagement ratio). Key metrics: 1-day, 7-day, and 28-day user retention, Net Promoter Score (NPS), Churn Rate, and Expansion ARR (Additional recurring revenue from existing users upgrading).",
  },
  {
    id: "pm-t3",
    role: "Product Manager",
    question_text: "Imagine our main competitor just cut their prices by 30%. How would you analyze this threat and advise our executive leadership?",
    question_type: "technical",
    difficulty: "hard",
    model_answer: "I would analyze three areas: Cost of switching (churn probability), customer segments impacted (price-sensitive vs value-driven), and margin viability of their price cut. I would advise leadership to avoid price wars, which destroy value. Instead, we should double down on unique product differentiators, introduce a low-cost tier with limited usage, or bundle high-value features.",
  },

  // --- DATA ANALYST ---
  {
    id: "da-b1",
    role: "Data Analyst",
    question_text: "Tell me about a time you found an unexpected, high-value insight in a dataset. How did you communicate this to non-technical stakeholders?",
    question_type: "behavioral",
    difficulty: "medium",
    model_answer: "Situation: Analyzing user drop-off data. Task: Find reasons for high trial-to-paid churn. Action: I discovered that users who completed their profile in the first 2 days were 5x more likely to convert. I converted my SQL scripts and regression models into a simple, high-impact 3-slide visual presentation showing user conversion trends. Result: Product team changed the onboarding flow to force profile completion. Conversion rate increased by 14%. Learning: Visual summaries beat complex tables.",
  },
  {
    id: "da-b2",
    role: "Data Analyst",
    question_text: "Describe a time when you had to work with extremely messy or incomplete data to answer an urgent business question. How did you handle it?",
    question_type: "behavioral",
    difficulty: "medium",
    model_answer: "Situation: Urgent marketing performance report needed, but attribution tracking had been broken for 2 weeks. Task: Estimate campaign ROI. Action: I extracted raw server logs, joined them with incomplete Google Analytics records, used historical conversion weights to impute missing fields, and clearly documented my assumptions and confidence intervals. Result: Business got an accurate directional ROI report. Learning: Document methodology clearly to maintain trust.",
  },
  {
    id: "da-t1",
    role: "Data Analyst",
    question_text: "What is the difference between a Left Join and an Inner Join in SQL? Provide a real-world scenario where you must use a Left Join.",
    question_type: "technical",
    difficulty: "easy",
    model_answer: "An Inner Join returns only the rows that have matching values in both tables. A Left Join returns all rows from the left table, plus matching rows from the right table (with nulls where there is no match). Real-world scenario: Fetching a list of all customers and their total purchases. We must use a Left Join so customers with zero purchases (no records in purchases table) still appear in the list with a NULL/0 purchase count.",
  },
  {
    id: "da-t2",
    role: "Data Analyst",
    question_text: "Explain the difference between Correlation and Causation. How would you design an experiment to prove causation for a new website layout?",
    question_type: "technical",
    difficulty: "medium",
    model_answer: "Correlation means two variables move together (e.g., ice cream sales and sunburns). Causation means one variable directly influences the other (e.g., hot weather causes sunburns). To prove causation, I would design a randomized A/B test: randomly divide web traffic (50% control with old layout, 50% treatment with new layout), control external variables, and run a t-test to check if the conversion rate lift is statistically significant (p-value < 0.05).",
  },
  {
    id: "da-t3",
    role: "Data Analyst",
    question_text: "What is overfitting in a machine learning or statistical model? How do you detect and prevent it?",
    question_type: "technical",
    difficulty: "hard",
    model_answer: "Overfitting occurs when a model learns the noise and details of the training data too well, resulting in poor performance on unseen data. It is detected when training accuracy is very high but validation/test accuracy is low. It is prevented by using cross-validation, simplifying the model (fewer features), implementing regularization (L1/L2), or gathering more training data.",
  },

  // --- SALES REPRESENTATIVE ---
  {
    id: "sales-b1",
    role: "Sales Representative",
    question_text: "Describe your most challenging deal that you closed. What obstacles did you face and how did you overcome them?",
    question_type: "behavioral",
    difficulty: "hard",
    model_answer: "Situation: Pitching a $120k software license to a highly conservative enterprise client. Task: Overcome intense security objections. Action: I brought in our lead security engineer for a dedicated technical Q&A, drafted a custom service level agreement (SLA), and offered a 30-day sandbox pilot with their dummy data. Result: The client felt secure, signed a 2-year contract. Learning: Collaborate with cross-functional experts to solve complex technical sales blocks.",
  },
  {
    id: "sales-b2",
    role: "Sales Representative",
    question_text: "How do you handle a prospect who tells you that your product is too expensive compared to competitors?",
    question_type: "behavioral",
    difficulty: "medium",
    model_answer: "I never discount price immediately. Instead, I validate their concern and pivot to ROI: 'I understand budget is a priority. Let's look at the costs of not fixing your current efficiency leaks.' I quantify how our tool saves 15 hours per employee per week, showing that the tool pays for itself in 3 months. I establish our unique value (support, security) that competitors lack.",
  },
  {
    id: "sales-t1",
    role: "Sales Representative",
    question_text: "What is your process for qualification? Explain the BANT framework and how you apply it to a discovery call.",
    question_type: "technical",
    difficulty: "easy",
    model_answer: "BANT stands for Budget (does the prospect have budget?), Authority (am I talking to the decision maker?), Need (do they have a pain point we solve?), and Timeline (when do they need to implement?). During discovery, I ask open-ended questions like 'What is your current workflow bottleneck?' and 'Who else is involved in reviewing software purchases?' to qualify them naturally.",
  },
  {
    id: "sales-t2",
    role: "Sales Representative",
    question_text: "How do you manage your sales pipeline? What metrics do you look at to ensure you will hit your quarterly quotas?",
    question_type: "technical",
    difficulty: "medium",
    model_answer: "I track: Lead-to-Opportunity conversion rate, average deal size, win rate (from qualified opportunity to closed-won), and average sales cycle length. I ensure my total pipeline value is always 3x to 4x my quarterly quota, which covers the average win-rate fallback.",
  },

  // --- GENERIC BEHAVIORAL & STAR METHOD ---
  {
    id: "gen-b1",
    role: "All",
    question_text: "Give an example of a goal you reached and tell me how you achieved it.",
    question_type: "behavioral",
    difficulty: "easy",
    model_answer: "Situation: I wanted to obtain my AWS Solutions Architect certification. Task: Complete the course and pass the exam within 3 months. Action: I blocked out 1 hour every morning before work, completed a 40-hour Udemy course, built 5 hands-on projects, and did 10 practice tests. Result: Passed the exam with a score of 880/1000 on my first attempt.",
  },
  {
    id: "gen-b2",
    role: "All",
    question_text: "Describe a time when you were faced with a stressful situation that demonstrated your coping skills.",
    question_type: "behavioral",
    difficulty: "easy",
    model_answer: "Situation: A critical presentation deck was lost 2 hours before a major client meeting. Task: Recreate the content and prepare for the meeting. Action: I maintained composure, delegated slide recreation duties to my teammate, focused on writing the executive summary script from memory, and practiced my verbal pitch. Result: We delivered the presentation on time and signed the client. Learning: Staying calm and focused beats panic.",
  }
];

// In-Memory Cosine Similarity RAG engine using Gemini Embeddings
export class RAGEngine {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    this.ai = new GoogleGenAI({
      apiKey: apiKey || process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Get cosine similarity between two vectors
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Keyword similarity fallback in case of no API key or limits
  private keywordOverlap(text1: string, text2: string): number {
    const clean = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/);
    const words1 = new Set(clean(text1));
    const words2 = new Set(clean(text2));
    let intersection = 0;
    words1.forEach((w) => {
      if (words2.has(w) && w.length > 3) {
        intersection++;
      }
    });
    return intersection / Math.max(1, words1.size + words2.size - intersection);
  }

  // Retrieve relevant questions based on role + JD
  async retrieveQuestions(
    role: string,
    jobDescription: string,
    count: number = 5,
    difficulty: "easy" | "medium" | "hard" = "medium"
  ): Promise<QuestionBankItem[]> {
    // 1. Filter bank by role (or "All") and difficulty
    const targetRoleLower = role.toLowerCase();
    
    // Find questions matching the specific role, or fall back to "All" if none exist
    let filtered = QUESTION_BANK.filter(
      (q) => q.role.toLowerCase() === targetRoleLower || q.role === "All"
    );

    if (filtered.length === 0) {
      // If a totally custom role is passed, fall back to "All" + general software questions or similar
      filtered = QUESTION_BANK.filter((q) => q.role === "All" || q.role === "Software Engineer");
    }

    // Attempt semantic embedding-based RAG if we have an API key
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
      try {
        // Embed the query (role + JD)
        const queryText = `${role} ${jobDescription}`;
        const queryEmbedRes = await this.ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: queryText,
        });

        const queryVector = (queryEmbedRes as any).embedding?.values || (queryEmbedRes as any).embeddings?.[0]?.values;

        if (queryVector) {
          // Embed our filtered candidates (we do this on-the-fly for the subset, which is fast, usually 5-15 items)
          const scoredItems = await Promise.all(
            filtered.map(async (item) => {
              try {
                const itemEmbedRes = await this.ai.models.embedContent({
                  model: "gemini-embedding-2-preview",
                  contents: `${item.question_text} ${item.model_answer}`,
                });
                const itemVector = (itemEmbedRes as any).embedding?.values || (itemEmbedRes as any).embeddings?.[0]?.values;
                if (itemVector) {
                  const similarity = this.cosineSimilarity(queryVector, itemVector);
                  // Give slight boost to matching difficulty
                  const diffMultiplier = item.difficulty === difficulty ? 1.1 : 0.95;
                  return { item, score: similarity * diffMultiplier };
                }
              } catch (e) {
                console.error("Error embedding item", item.id, e);
              }
              // Fallback to keyword matching score if embedding fails
              return { item, score: this.keywordOverlap(queryText, item.question_text) };
            })
          );

          // Sort by score descending
          scoredItems.sort((a, b) => b.score - a.score);
          return scoredItems.slice(0, count).map((si) => si.item);
        }
      } catch (err) {
        console.error("Embedding RAG failed, falling back to smart keyword/metadata selection", err);
      }
    }

    // Smart metadata/keyword matching fallback (extremely fast, zero cost, 100% reliable)
    const queryText = `${role} ${jobDescription}`;
    const scored = filtered.map((item) => {
      let score = this.keywordOverlap(queryText, item.question_text);
      // Boost if difficulty matches
      if (item.difficulty === difficulty) score += 0.2;
      // Boost if it matches the specific role directly (vs "All")
      if (item.role.toLowerCase() === targetRoleLower) score += 0.3;
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map((s) => s.item);
  }
}
