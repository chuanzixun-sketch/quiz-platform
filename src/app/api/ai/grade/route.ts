import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

interface GradeRequest {
  question: {
    type: string;
    question: string;
    options?: string[];
    answer?: string | string[];
    analysis?: string;
  };
  userAnswer: string | string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GradeRequest = await request.json();
    const { question, userAnswer } = body;

    if (!question || !userAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For objective questions (single choice, multiple choice, true/false), grade directly
    if (question.type === 'single' || question.type === 'true_false' || question.type === 'multiple') {
      const correctAnswer = question.answer;
      let isCorrect = false;

      if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
        const sortedCorrect = [...correctAnswer].sort();
        const sortedUser = [...userAnswer].sort();
        isCorrect =
          sortedCorrect.length === sortedUser.length &&
          sortedCorrect.every((v, i) => v === sortedUser[i]);
      } else {
        isCorrect = correctAnswer === userAnswer;
      }

      return NextResponse.json({
        score: isCorrect ? 100 : 0,
        isCorrect,
        feedback: isCorrect ? '回答正确！' : '回答错误。',
        analysis: question.analysis || '',
      });
    }

    // For subjective questions (fill_blank, short_answer), use AI grading
    const prompt = `
你是一个智能批改助手。请批改以下答案。

题目类型：${question.type}
题目内容：${question.question}
${question.options ? `选项：${question.options.join(', ')}` : ''}
标准答案：${Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}
学生的答案：${Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer}

请评分（0-100分），判断是否正确，并给出反馈意见和详细分析。

请以JSON格式返回：
{"score": 85, "isCorrect": true, "feedback": "反馈意见", "analysis": "详细分析"}
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
            content: '你是一个智能批改助手。请以JSON格式输出评分结果。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      return NextResponse.json(
        { error: 'AI grading service error' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        score: 0,
        isCorrect: false,
        feedback: '批改失败，请重试',
        analysis: '',
      };
    } catch {
      parsed = {
        score: 0,
        isCorrect: false,
        feedback: '批改失败',
        analysis: content,
      };
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error in AI grade:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
