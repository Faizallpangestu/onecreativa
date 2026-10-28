<?php
// Copy to mail.local.php on the server. That file is ignored by Git and builds.
// Alternatively configure the CREATIVA_SMTP_* environment variables.
return [
    'host' => '',
    'port' => 587,
    'encryption' => 'tls', // tls (STARTTLS) or ssl (SMTPS)
    'username' => '',
    'password' => '',
    'from_email' => '',
    'from_name' => 'Finance Creativa',
    'ca_file' => '', // Optional path to a trusted CA bundle; TLS verification stays enabled.
];
