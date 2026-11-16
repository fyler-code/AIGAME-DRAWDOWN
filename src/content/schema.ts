import { z } from 'zod'

const statBlock = z
  .object({
    money: z.number().int().min(-50).max(50).optional(),
    spirit: z.number().int().min(-50).max(50).optional(),
    family: z.number().int().min(-50).max(50).optional(),
    career: z.number().int().min(-50).max(50).optional(),
  })
  .strict()

const flagBlock = z
  .object({
    compliance: z.number().int().min(-3).max(3).optional(),
    absent: z.number().int().min(-5).max(5).optional(),
    hot_streak: z.number().int().min(-5).max(5).optional(),
    insomnia: z.number().int().min(-3).max(3).optional(),
  })
  .strict()

const effectSchema = z
  .object({
    money: z.number().int().optional(),
    spirit: z.number().int().optional(),
    family: z.number().int().optional(),
    career: z.number().int().optional(),
    flags: flagBlock.optional(),
    counters: z.record(z.string(), z.number().int()).optional(),
  })
  .strict()
  .refine(
    (e) => ['money', 'spirit', 'family', 'career'].some((k) => e[k as keyof typeof e] !== undefined),
    { message: 'effect 至少要改一项属性' },
  )

const optionSchema = z
  .object({
    label: z.string().min(1).max(4),
    effect: effectSchema,
  })
  .strict()

const conditionSchema = z
  .object({
    minStats: statBlock.optional(),
    maxStats: statBlock.optional(),
    flagAtLeast: flagBlock.optional(),
    weekRange: z.tuple([z.number().int().min(1), z.number().int().max(52)]).optional(),
    character: z.enum(['trader', 'fundManager', 'hotMoney', 'retail']).optional(),
  })
  .strict()

export const cardSchema = z
  .object({
    from: z.enum(['wechat', 'work', 'family', 'news', 'inner']),
    speaker: z.string().min(1).max(6).optional(),
    text: z.string().min(1).max(42),
    tags: z
      .array(z.enum(['公司', '市场', '家庭', '宏观', '荒诞', '内心', 'tutorial', '仓位']))
      .min(1),
    weight: z.number().int().min(1).max(100).default(10),
    phase: z.enum(['bull', 'bear', 'chop']).optional(),
    require: conditionSchema.optional(),
    once: z.boolean().optional(),
    delay: z
      .object({
        weeks: z.number().int().min(1).max(12),
        leverage: z.union([z.literal(1), z.literal(2)]),
      })
      .strict()
      .optional(),
    up: optionSchema,
    down: optionSchema,
  })
  .strict()
  .refine(
    (c) => {
      // 两边不能都是纯正收益（设计支柱：没有免费的选项）
      const net = (e: { money?: number; spirit?: number; family?: number; career?: number }) =>
        (e.money ?? 0) + (e.spirit ?? 0) + (e.family ?? 0) + (e.career ?? 0)
      return net(c.up.effect) <= 0 || net(c.down.effect) <= 0
    },
    { message: '两个选项不能都是净正收益（无代价选项禁止）' },
  )

export type CardInput = z.infer<typeof cardSchema>
