<?php
// jwt.php - Helper ringan untuk JWT tanpa package external

class JWT {
    private static $secret = 'CreativaHRIS_SuperSecretKey_2026!'; // Ganti dengan secret key yang aman di production

    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($jwt) {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) return false;
        
        list($header64, $payload64, $signature64) = $parts;
        
        $signature = hash_hmac('sha256', $header64 . "." . $payload64, self::$secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if ($base64UrlSignature === $signature64) {
            $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload64)), true);
            // Cek expiration jika ada
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return false; // Token expired
            }
            return $payload;
        }
        return false;
    }

    public static function getBearerToken() {
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx or fast CGI
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    public static function verifyOrDie() {
        $token = self::getBearerToken();
        if (!$token) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Unauthorized - Token missing"]);
            exit;
        }
        $payload = self::decode($token);
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Unauthorized - Invalid or expired token"]);
            exit;
        }
        return $payload;
    }
}
