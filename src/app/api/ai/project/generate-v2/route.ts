import { generateObject, tool } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

// Define the schema for the structured output
const ProjectSchema = z.object({
  epics: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      stories: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          acceptanceCriteria: z.array(z.string()),
        })
      ),
    })
  ),
  estimations: z.object({
    developmentTime: z.string(),
    cost: z.string(),
    teamSize: z.string(),
  }),
});

const ZGenProjectInput = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const GET = async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const query = Object.fromEntries(searchParams.entries());
  const valid = ZGenProjectInput.safeParse(query);
  if (!valid.success) {
    return NextResponse.json({ error: valid.error }, { status: 400 });
  }
  const { name = "New Project", description = "" } = valid.data;

  const SYSTEM_PROMPT = `
    You are an expert AI Project Architect. Your goal is to analyze a project idea and generate a comprehensive project structure.
    
    You will be given a Project Name and a Description.
    
    Your responsibilities:
    1.  **Analyze**: Understand the core value proposition, target audience, and key features of the project.
    2.  **Structure**: Break down the project into logical Epics.
    3.  **Detail**: For each Epic, create specific User Stories with clear Acceptance Criteria.
    4.  **Estimate**: Provide a rough estimation of development time, cost, and team size based on industry standards for a MVP.
  `;

  try {
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      system: SYSTEM_PROMPT.trim(),
      prompt: `Project Name: ${name}\nDescription: ${description}`,
      schema: ProjectSchema,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Error generating project:", error);
    return NextResponse.json(
      { error: "Failed to generate project structure." },
      { status: 500 }
    );
  }
};
