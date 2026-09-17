import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";
import { getDemoAssistantPage } from "@/lib/demo-data";
import AssistantView from "@/components/assistant/assistant-view";

type CourseRow = {
  name: string;
  topics: { name: string }[] | null;
};

export default async function AssistantPage() {
  if (await isDemoMode()) {
    const demo = getDemoAssistantPage();
    return (
      <AssistantView
        demo
        greeting="Hi, I'm your study assistant. In demo mode, AI chat is turned off — sign in to ask me to explain things, quiz you, or plan your studying."
        suggestions={["How do I sign up?", "What can I do in the demo?"]}
      />
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("name, topics(name)")
    .order("name");

  const rows = (data ?? []) as unknown as CourseRow[];
  const topicNames = rows.flatMap((row) =>
    (row.topics ?? []).map((topic) => topic.name)
  );

  const suggestions: string[] = [];
  if (topicNames[0]) suggestions.push(`Quiz me on ${topicNames[0]}`);
  if (rows[0]) suggestions.push(`Explain ${rows[0].name} from scratch`);
  if (topicNames[1]) suggestions.push(`I'm stuck on ${topicNames[1]} — help me`);
  suggestions.push("What should I work on today?");

  const greeting =
    rows.length === 0
      ? "Hi, I'm your study assistant! Add a course with topics first, then come back and I'll explain things, quiz you, or help you plan your studying."
      : "Hi, I'm your study assistant. I can see your courses and topics — ask me to explain something, quiz you, or figure out what to study next.";

  return <AssistantView greeting={greeting} suggestions={suggestions.slice(0, 4)} />;
}