package com.example.thanhtoannoibo.Controller;
import com.example.thanhtoannoibo.DTO.Request.QrCode.GenerateQrRequest;
import com.example.thanhtoannoibo.DTO.Request.QrCode.ProcessQrRequest;
import com.example.thanhtoannoibo.DTO.Request.Transfer.QrCodeRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.QrCode.ProcessQrResponse;
import com.example.thanhtoannoibo.DTO.Response.QrCode.QrResponse;
import com.example.thanhtoannoibo.DTO.Response.Transfer.QrCodeResponse;
import com.example.thanhtoannoibo.DTO.Response.Transfer.TransferResponse;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.DTO.Request.Transfer.TransferRequest;
import com.example.thanhtoannoibo.Service.QrCode.QrCodeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/qrcode")
@RequiredArgsConstructor
public class QrCodeController {
    private final QrCodeService qrCodeService;

    @PostMapping("/generate")
    public ResponseEntity<BaseResponse<QrResponse>> generateQr(
            @Valid @RequestBody GenerateQrRequest request,
            HttpServletRequest httpRequest
    ) {
        // Set metadata IP/Device nếu cần (BaseRequest)
        request.setClientIp(httpRequest.getRemoteAddr());

        QrResponse response = qrCodeService.generateQr(request, httpRequest);

        return ResponseEntity.ok(BaseResponse.success(response, "Tạo mã QR thành công"));
    }

    @PostMapping("/redeem")
    public BaseResponse<ProcessQrResponse> processTransaction(
            @RequestBody @Valid ProcessQrRequest request,
            HttpServletRequest httpRequest
    ) {
        return BaseResponse.success(qrCodeService.processTransaction(request, httpRequest));
    }
}
