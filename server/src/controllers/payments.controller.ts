import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay';

import { BadRequestError } from '../core/error.response';
import { OK } from '../core/success.response';

import User from '../models/users.model';
import RechargeUser from '../models/RechargeUser.model';

import { v4 as uuidv4 } from 'uuid';

class PaymentsController {
  async payments(req: Request, res: Response): Promise<void> {
    const { id } = req.user;
    const { typePayment, amountUser } = req.body;

    if (!typePayment) {
      throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
    }

    if (typePayment === 'MOMO') {
      const partnerCode = 'MOMO';
      const accessKey = 'F8BBA842ECF85';
      const secretkey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      const requestId = partnerCode + new Date().getTime();
      const orderId = requestId;
      const orderInfo = `nap tien ${id}`; // nội dung giao dịch thanh toán
      const redirectUrl = 'http://localhost:3000/api/check-payment-momo'; // 8080
      const ipnUrl = 'http://localhost:3000/api/check-payment-momo';
      const amount = amountUser;
      const requestType = 'captureWallet';
      const extraData = ''; //pass empty value if your merchant does not have stores

      const rawSignature =
        'accessKey=' +
        accessKey +
        '&amount=' +
        amount +
        '&extraData=' +
        extraData +
        '&ipnUrl=' +
        ipnUrl +
        '&orderId=' +
        orderId +
        '&orderInfo=' +
        orderInfo +
        '&partnerCode=' +
        partnerCode +
        '&redirectUrl=' +
        redirectUrl +
        '&requestId=' +
        requestId +
        '&requestType=' +
        requestType;
      //puts raw signature

      //signature
      const signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');

      //json object send to MoMo endpoint
      const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'en',
      });

      const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      new OK({ message: 'Thanh toán thông báo', metadata: response.data }).send(res);
    }
    if (typePayment === 'VNPAY') {
      const vnpay = new VNPay({
        tmnCode: 'DH2F13SW',
        secureSecret: 'NXZM3DWFR0LC4R5VBK85OJZS1UE9KI6F',
        vnpayHost: 'https://sandbox.vnpayment.vn',
        testMode: true, // tùy chọn
        hashAlgorithm: 'SHA512', // tùy chọn
        loggerFn: ignoreLogger, // tùy chọn
      });
      const uuid = uuidv4();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const vnpayResponse = await vnpay.buildPaymentUrl({
        vnp_Amount: amountUser, //
        vnp_IpAddr: '127.0.0.1', //
        vnp_TxnRef: `${id}-${uuid}`,
        vnp_OrderInfo: `nap tien ${id}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: `http://localhost:3000/api/check-payment-vnpay`, //
        vnp_Locale: VnpLocale.VN, // 'vn' hoặc 'en'
        vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là hiện tại
        vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn
      });
      new OK({ message: 'Thanh toán thông báo', metadata: vnpayResponse }).send(res);
    }
  }

  async checkPaymentMomo(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { orderInfo, resultCode, amount } = req.query;

    if (resultCode === '0') {
      const result = (orderInfo as string).split(' ')[2];
      const findUser = await User.findOne({ _id: result });
      if (findUser) {
        findUser.balance += Number(amount);
        await findUser.save();
        const socket = (global as any).usersMap.get(findUser._id.toString());
        if (socket) {
          socket.emit('new-payment', {
            userId: findUser._id,
            amount: amount,
            date: new Date(),
            typePayment: 'MOMO',
          });
          await RechargeUser.create({
            userId: findUser._id,
            amount: amount,
            typePayment: 'MOMO',
            status: 'success',
          });
          res.redirect(`http://localhost:5173/trang-ca-nhan`);
          return;
        }
      }
    }
  }

  async checkPaymentVnpay(req: Request, res: Response): Promise<void> {
    const { vnp_ResponseCode, vnp_OrderInfo, vnp_Amount } = req.query;

    if (vnp_ResponseCode === '00') {
      const result = (vnp_OrderInfo as string).split(' ')[2];
      const findUser = await User.findOne({ _id: result });
      if (findUser) {
        findUser.balance += Number((vnp_Amount as string).slice(0, -2));
        await findUser.save();
        const socket = (global as any).usersMap.get(findUser._id.toString());
        if (socket) {
          socket.emit('new-payment', {
            userId: findUser._id,
            amount: (vnp_Amount as string).slice(0, -2),
            date: new Date(),
            typePayment: 'VNPAY',
          });
          await RechargeUser.create({
            userId: findUser._id,
            amount: (vnp_Amount as string).slice(0, -2),
            typePayment: 'VNPAY',
            status: 'success',
          });
          res.redirect(`http://localhost:5173/trang-ca-nhan`);
          return;
        } else {
          res.redirect(`http://localhost:5173/trang-ca-nhan`);
          return;
        }
      }
    }
  }
}

export default new PaymentsController();