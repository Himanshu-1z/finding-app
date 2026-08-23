import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { optionalJwt } from "../middleware/auth";

export const paymentRouter = Router();

// POST /api/payment/initiate
paymentRouter.post("/initiate", optionalJwt, async (req: Request, res: Response) => {
  try {
    const { chatRoomId } = req.body;
    let userId = req.user?.id;
    if (!userId) {
      const guest = await prisma.user.findFirst();
      userId = guest?.id || "";
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        chatRoomId: chatRoomId || null,
        amount: 49.0,
        status: "Pending",
        transactionRef: "TXN_" + Date.now(),
      },
    });

    return res.json({
      paymentId: payment.id,
      amount: payment.amount,
      currency: "INR",
      transactionRef: payment.transactionRef,
      status: payment.status,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/confirm
paymentRouter.post("/confirm", optionalJwt, async (req: Request, res: Response) => {
  try {
    const { paymentId, transactionRef } = req.body;
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id: paymentId }, { transactionRef: transactionRef }],
      },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "Completed" },
      });
    }

    return res.json({ success: true, status: "Completed" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

