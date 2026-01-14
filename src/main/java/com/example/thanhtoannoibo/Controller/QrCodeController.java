package com.example.thanhtoannoibo.Controller;
import com.example.thanhtoannoibo.DTO.Request.Transfer.QrCodeRequest;
import com.example.thanhtoannoibo.DTO.Response.Transfer.QrCodeResponse;
import com.example.thanhtoannoibo.DTO.Response.Transfer.TransferResponse;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.DTO.Request.Transfer.TransferRequest;
import com.example.thanhtoannoibo.Service.QrCode.QrCodeService;
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
    public ResponseEntity<QrCodeResponse> generateQRCode(@Valid @RequestBody QrCodeRequest request) {

        QRCode qrCode = qrCodeService.generateQRCode(
                request.getOwnerId(),
                request.getQrType(),
                request.getAmount(),
                request.getExpiresInMinutes(),
                request.getUsageLimit(),
                null // voucherId (optional) - service expects this param
        );

        QrCodeResponse response = QrCodeResponse.builder()
                .qrId(qrCode.getQrId())
                .qrCode(qrCode.getCodeString()) // entity field: codeString
                .qrType(qrCode.getType())       // entity field: type
                .amount(qrCode.getAmount())
                .expiresAt(qrCode.getExpiresAt())
                .usageLimit(qrCode.getUsageLimit())
                .status(qrCode.getStatus())
                .build();

        return ResponseEntity.ok(response);
    }

//    @PostMapping("/transfer")
//    public ResponseEntity<TransferResponse> transferByQRCode(@Valid @RequestBody TransferRequest request) {
//
//        var transferRequest = qrCodeService.processQRTransfer(
//                request.getQrCode(),
//                request.getSenderWalletId(),
//                request.getAmount(),
//                request.getMessage(),
//                request.getUserId()
//        );
//
//        TransferResponse response = TransferResponse.builder()
//                .requestId(transferRequest.getRequestId())
//                .status(transferRequest.getStatus())
//                .amount(transferRequest.getAmount())
//                .message("QR transfer initiated successfully")
//                .build();
//
//        return ResponseEntity.ok(response);
//    }
//
//    @GetMapping("/{qrCode}")
//    public ResponseEntity<QrCodeResponse> getQRCodeInfo(@PathVariable String qrCode) {
//
//        return qrCodeService.getQRCode(qrCode)
//                .map(qr -> {
//                    QrCodeResponse response = QrCodeResponse.builder()
//                            .qrId(qr.getQrId())
//                            .qrCode(qr.getQrCode())
//                            .qrType(qr.getQrType())
//                            .amount(qr.getAmount())
//                            .expiresAt(qr.getExpiresAt())
//                            .usageLimit(qr.getUsageLimit())
//                            .usageCount(qr.getUsageCount())
//                            .status(qr.getStatus())
//                            .build();
//                    return ResponseEntity.ok(response);
//                })
//                .orElse(ResponseEntity.notFound().build());
//    }
}
