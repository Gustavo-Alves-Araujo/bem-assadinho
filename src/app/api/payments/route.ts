import { NextRequest, NextResponse } from "next/server";

// Pagar.me / Ton integration endpoint
// This simulates the payment processing with Pagar.me API
// In production, replace with actual Pagar.me API calls
const PAGARME_API_URL = "https://api.pagar.me/core/v5";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { amount, paymentMethod, installments, cardToken, customerName } = body;

  // API key should be in env
  const apiKey = process.env.PAGARME_API_KEY;

  if (!apiKey) {
    // Simulate successful payment when no API key is configured
    return NextResponse.json({
      success: true,
      transactionId: `sim_${Date.now()}`,
      status: "paid",
      message: "Pagamento simulado com sucesso (Configure PAGARME_API_KEY para produção)",
    });
  }

  try {
    let orderData: Record<string, unknown> = {
      items: [
        {
          amount: Math.round(amount * 100), // Pagar.me uses cents
          description: "Venda PDV",
          quantity: 1,
          code: `pdv_${Date.now()}`,
        },
      ],
      customer: {
        name: customerName || "Cliente PDV",
        type: "individual",
        email: "cliente@pdv.local",
        document: "00000000000",
      },
      payments: [] as Record<string, unknown>[],
    };

    if (paymentMethod === "credit") {
      orderData.payments = [
        {
          payment_method: "credit_card",
          credit_card: {
            installments: installments || 1,
            card_token: cardToken,
            statement_descriptor: "MEUPDV",
          },
        },
      ];
    } else if (paymentMethod === "debit") {
      orderData.payments = [
        {
          payment_method: "debit_card",
          debit_card: {
            card_token: cardToken,
            statement_descriptor: "MEUPDV",
          },
        },
      ];
    } else if (paymentMethod === "pix") {
      orderData.payments = [
        {
          payment_method: "pix",
          pix: {
            expires_in: 300, // 5 minutes
          },
        },
      ];
    } else {
      // Cash - no payment processing needed
      return NextResponse.json({
        success: true,
        transactionId: `cash_${Date.now()}`,
        status: "paid",
        message: "Pagamento em dinheiro registrado",
      });
    }

    const response = await fetch(`${PAGARME_API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        transactionId: result.id,
        status: result.status,
        pixQrCode: result.charges?.[0]?.last_transaction?.qr_code,
        pixQrCodeUrl: result.charges?.[0]?.last_transaction?.qr_code_url,
        message: "Pagamento processado com sucesso",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Erro no processamento",
          details: result,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro de conexão com gateway de pagamento" },
      { status: 500 }
    );
  }
}
