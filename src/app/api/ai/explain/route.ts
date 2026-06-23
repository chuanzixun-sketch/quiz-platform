import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

interface ExplainRequest {
  question: {
    type: string;
    question: string;
    options?: string[];
    answer?: string | string[];
    analysis?: string;
    difficulty?: number;
  };
  userAnswer?: string | string[];
  correctAnswer?: string | string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ExplainRequest = await request.json();
    const { question, userAnswer, correctAnswer } = body;

    if (!question || !question.question) {
      return NextResponse.json({ error: 'Missing question content' }, { status: 400 });
    }

    const prompt = `
你是一个专业的题目解析助手。请对以下题目进行详细解析。

题目类型：${question.type}
题目内容：${question.question}
${question.options ? `选项：${question.options.join(', ')}` : ''}
${correctAnswer ? `正确答案：${Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}` : ''}
${userAnswer ? `用户的答案：${Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer}` : ''}

请提供：
1. 详细解析（解释为什么正确答案是正确的）
2. 关键知识点（列出本题涉及的核心知识点）
3. 相关扩展知识（相关的知识点拓展）
4. 难度评估（1-5星）

请以JSON格式返回：
{"explanation": "详细解析", "keyPoints": ["知识点1", "知识点2"], "relatedKnowledge": ["扩展1", "扩展2"], "difficulty": 3}
`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的题目解析AI助手。请以JSON格式输出。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      return NextResponse.json(
        { error: 'AI service error' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        explanation: content,
        keyPoints: [],
        relatedKnowledge: [],
        difficulty: 3,
      };
    } catch {
      parsed = {
        explanation: content,
        keyPoints: [],
        relatedKnowledge: [],
        difficulty: 3,
      };
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error in AI explain:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
