import Block from '../models/Block.js'

export async function isBlockedEitherWay(userA, userB) {
  const block = await Block.findOne({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  })
  return !!block
}
