<?php
/** Customer appointment helpers. Existing staff authentication / database helpers come from feature-tools.php. */

function booking_options(): array
{
    return [
        'new_construction' => 'New construction',
        'renovation' => 'Renovation & extension',
        'interior_design' => 'Interior design',
        'custom_cabinetry' => 'Custom cabinetry',
        'furnishing' => 'Furniture & finishing',
        'commercial_fitout' => 'Commercial fit-out',
        'other' => 'Not sure / other',
    ];
}

function booking_property_types(): array
{
    return ['residential' => 'Residential', 'commercial' => 'Commercial', 'other' => 'Other / not sure'];
}

function booking_stages(): array
{
    return ['exploring' => 'Just exploring', 'planning' => 'Planning / designing', 'site_ready' => 'Site or property ready', 'ongoing' => 'Work in progress', 'not_sure' => 'Not sure yet'];
}

function booking_budgets(): array
{
    return ['unsure' => 'Not sure yet', 'below_20k' => 'Below RM 20,000', '20k_50k' => 'RM 20,000 – 50,000', '50k_100k' => 'RM 50,000 – 100,000', '100k_300k' => 'RM 100,000 – 300,000', '300k_500k' => 'RM 300,000 – 500,000', 'above_500k' => 'Above RM 500,000'];
}

function booking_appointment_types(): array
{
    // Preserve the four appointment_type values accepted by the existing system.
    return ['consultation' => 'Project consultation', 'site_measurement' => 'Site measurement', 'showroom_visit' => 'Showroom visit', 'design_review' => 'Design review'];
}

function booking_methods(): array
{
    return ['showroom' => 'Showroom / office', 'onsite' => 'At my property', 'online' => 'Online meeting', 'phone' => 'Phone call'];
}

function booking_old(string $key, string $fallback = ''): string
{
    $value = $_POST[$key] ?? $fallback;
    return h(is_string($value) ? $value : $fallback);
}

function booking_date(string $value, DateTimeZone $zone): ?DateTimeImmutable
{
    if (!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/D', $value)) return null;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d\TH:i', $value, $zone);
    if (!$date || $date->format('Y-m-d\TH:i') !== $value) return null;
    return $date;
}

/** @return array<int, array<string, mixed>> */
function booking_selected_uploads(): array
{
    if (!isset($_FILES['references'])) return [];
    $data = $_FILES['references'];
    if (!is_array($data['name'] ?? null) || count($data['name']) > 3) {
        throw new RuntimeException('Please attach no more than 3 files.');
    }
    $selected = [];
    foreach ($data['name'] as $i => $name) {
        $err = (int)($data['error'][$i] ?? UPLOAD_ERR_NO_FILE);
        if ($err === UPLOAD_ERR_NO_FILE) continue;
        if ($err !== UPLOAD_ERR_OK) throw new RuntimeException('A file could not be uploaded. Please check its size and try again.');
        $f = [
            'name' => (string)$name,
            'size' => (int)($data['size'][$i] ?? 0),
            'tmp_name' => (string)($data['tmp_name'][$i] ?? ''),
        ];
        if ($f['size'] <= 0 || $f['size'] > 5 * 1024 * 1024) {
            throw new RuntimeException('Each file must be smaller than 5 MB.');
        }
        if (!is_uploaded_file($f['tmp_name'])) throw new RuntimeException('A selected upload could not be verified.');
        $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg'=>'image/jpeg', 'jpeg'=>'image/jpeg', 'png'=>'image/png', 'webp'=>'image/webp', 'pdf'=>'application/pdf'];
        if (!isset($allowed[$ext])) throw new RuntimeException('Please use JPG, PNG, WEBP or PDF files only.');
        if (!class_exists('finfo')) throw new RuntimeException('File validation is unavailable. Please contact IdeaRE.');
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = (string)$finfo->file($f['tmp_name']);
        if ($mime !== $allowed[$ext]) throw new RuntimeException('An attachment does not match its file type.');
        $f['extension'] = $ext;
        $f['mime_type'] = $mime;
        // Do not allow original user filenames to affect filesystem paths.
        $f['name'] = substr(basename(str_replace('\\','/',$f['name'])), 0, 240);
        $selected[] = $f;
    }
    return $selected;
}

/** Atomically stores the appointment and its metadata; cleans up any files on a failed transaction. */
function booking_create(PDO $pdo, array $data, array $files): string
{
    $uploadedPaths = [];
    $projectRoot = dirname(__DIR__, 2);
    $uploadDir = $projectRoot . '/uploads/appointments';
    if (!is_dir($uploadDir) || !is_file($uploadDir.'/.htaccess')) {
        throw new RuntimeException('Private appointment file storage has not been set up. Please contact IdeaRE.');
    }

    $pdo->beginTransaction();
    try {
        $code = op_code('APT');
        $summary = "Requested service: ".booking_options()[$data['project_type']]."\n";
        $summary .= "Property type: ".booking_property_types()[$data['property_type']]."\n";
        if ($data['project_location'] !== '') $summary .= "Project area: ".$data['project_location']."\n";
        if ($data['project_notes'] !== '') $summary .= "Customer message:\n".$data['project_notes'];

        $insert = $pdo->prepare('INSERT INTO customer_appointments (appointment_code,customer_name,customer_phone,customer_email,appointment_type,requested_start,location,customer_notes,status) VALUES (?,?,?,?,?,?,?,?,?)');
        $insert->execute([
            $code, $data['customer_name'], $data['customer_phone'], $data['customer_email'] ?: null,
            $data['appointment_type'], $data['requested_start']->format('Y-m-d H:i:s'),
            $data['meeting_location'] ?: ($data['project_location'] ?: null), $summary, 'requested'
        ]);
        $appointmentId = (int)$pdo->lastInsertId();
        $details = $pdo->prepare('INSERT INTO customer_appointment_details (appointment_id,project_type,property_type,project_stage,project_focus,project_size,budget_range,project_location,consultation_method,alternative_start,preferred_contact) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        $details->execute([
            $appointmentId, $data['project_type'], $data['property_type'], $data['project_stage'] ?: null,
            $data['project_focus'] ?: null, $data['project_size'] ?: null, $data['budget_range'] ?: null,
            $data['project_location'] ?: null, $data['consultation_method'],
            $data['alternative_start'] ? $data['alternative_start']->format('Y-m-d H:i:s') : null,
            $data['preferred_contact']
        ]);

        $attach = $pdo->prepare('INSERT INTO customer_appointment_attachments (appointment_id,file_name,stored_name,mime_type,file_size) VALUES (?,?,?,?,?)');
        foreach ($files as $file) {
            $storedName = bin2hex(random_bytes(20)).'.'.$file['extension'];
            $fullPath = $uploadDir.'/'.$storedName;
            if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
                throw new RuntimeException('We could not save an attachment. Please try again.');
            }
            $uploadedPaths[] = $fullPath;
            $attach->execute([$appointmentId,$file['name'],$storedName,$file['mime_type'],$file['size']]);
        }
        $pdo->commit();
        return $code;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        foreach ($uploadedPaths as $path) @unlink($path);
        throw $e;
    }
}
