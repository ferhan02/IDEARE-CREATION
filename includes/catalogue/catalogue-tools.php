<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/databases.php';

function catalogue_h(?string $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function catalogue_identifier(string $name): string
{
    if (!preg_match('/^[A-Za-z0-9_]+$/', $name)) {
        throw new InvalidArgumentException('Invalid SQL identifier.');
    }
    return '`' . $name . '`';
}

function catalogue_columns(PDO $pdo, string $table): array
{
    static $cache = [];

    if (isset($cache[$table])) {
        return $cache[$table];
    }

    if (!preg_match('/^[A-Za-z0-9_]+$/', $table)) {
        return $cache[$table] = [];
    }

    try {
        $rows = $pdo->query('SHOW COLUMNS FROM ' . catalogue_identifier($table))->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        return $cache[$table] = [];
    }

    $map = [];
    foreach ($rows as $row) {
        $field = (string)($row['Field'] ?? '');
        if ($field !== '') {
            $map[strtolower($field)] = $field;
        }
    }

    return $cache[$table] = $map;
}

function catalogue_pick_column(array $columns, array $candidates): ?string
{
    foreach ($candidates as $candidate) {
        $key = strtolower($candidate);
        if (isset($columns[$key])) {
            return $columns[$key];
        }
    }
    return null;
}

function catalogue_expr(array $columns, array $candidates, string $alias, string $fallback = 'NULL'): string
{
    $column = catalogue_pick_column($columns, $candidates);
    $expr = $column ? catalogue_identifier($column) : $fallback;
    return $expr . ' AS ' . catalogue_identifier($alias);
}

function catalogue_literal(string $value): string
{
    return "'" . str_replace("'", "''", $value) . "'";
}

function catalogue_image_url(?string $path): string
{
    $path = trim((string)$path);
    if ($path === '') {
        return '';
    }

    $path = str_replace('\\', '/', $path);

    if (preg_match('#^https?://#i', $path) || str_starts_with($path, '/')) {
        return $path;
    }

    $path = ltrim($path, '/');

    if (str_starts_with($path, 'uploads/')) {
        return 'public/' . $path;
    }

    return $path;
}

function catalogue_page_url(int $page): string
{
    $params = $_GET;
    $params['page'] = max(1, $page);

    foreach ($params as $key => $value) {
        if ($value === '' || $value === null) {
            unset($params[$key]);
        }
    }

    return '?' . http_build_query($params);
}

function catalogue_build_hpl_base(PDO $pdo): string
{
    $tables = [
        'topmix' => 'Topmix',
        'dgtango' => 'DGtango',
    ];

    $parts = [];

    foreach ($tables as $table => $fallbackSupplier) {
        $columns = catalogue_columns($pdo, $table);
        if (!$columns) {
            continue;
        }

        $active = catalogue_pick_column($columns, ['is_active', 'active', 'status']);
        $where = '';

        if ($active) {
            if (strtolower($active) === 'status') {
                $where = ' WHERE (' . catalogue_identifier($active) . " IS NULL OR LOWER(CAST(" . catalogue_identifier($active) . " AS CHAR)) NOT IN ('inactive','disabled','archived'))";
            } else {
                $where = ' WHERE ' . catalogue_identifier($active) . ' = 1';
            }
        }

        $parts[] = 'SELECT '
            . catalogue_expr($columns, ['id'], 'id', '0') . ', '
            . catalogue_literal($table) . ' AS source_table, '
            . catalogue_literal($fallbackSupplier) . ' AS catalogue_group, '
            . catalogue_expr($columns, ['supplier'], 'supplier', catalogue_literal($fallbackSupplier)) . ', '
            . catalogue_expr($columns, ['brand'], 'brand', catalogue_literal($fallbackSupplier)) . ', '
            . catalogue_expr($columns, ['product_code', 'code', 'raw_code', 'sku'], 'product_code', "''") . ', '
            . catalogue_expr($columns, ['product_name', 'name', 'design_name'], 'product_name', "''") . ', '
            . catalogue_expr($columns, ['finish_code', 'finish', 'surface'], 'finish_code', "''") . ', '
            . catalogue_expr($columns, ['category', 'type'], 'category', "''") . ', '
            . catalogue_expr($columns, ['series', 'collection'], 'series', "''") . ', '
            . catalogue_expr($columns, ['image_filename', 'filename', 'image_file'], 'image_filename', "''") . ', '
            . catalogue_expr($columns, ['image_path', 'image_url', 'image', 'main_image'], 'image_path', "''")
            . ' FROM ' . catalogue_identifier($table)
            . $where;
    }

    if (!$parts) {
        throw new RuntimeException('The HPL catalogue tables (topmix / dgtango) were not found.');
    }

    return implode("\nUNION ALL\n", $parts);
}

function catalogue_build_stone_base(PDO $pdo): string
{
    $tables = [
        'casero_stone_sintered' => 'Sintered Stone',
        'casero_stone_quartz' => 'Quartz Stone',
    ];

    $parts = [];

    foreach ($tables as $table => $stoneType) {
        $columns = catalogue_columns($pdo, $table);
        if (!$columns) {
            continue;
        }

        $active = catalogue_pick_column($columns, ['is_active', 'active', 'status']);
        $where = '';

        if ($active) {
            if (strtolower($active) === 'status') {
                $where = ' WHERE (' . catalogue_identifier($active) . " IS NULL OR LOWER(CAST(" . catalogue_identifier($active) . " AS CHAR)) NOT IN ('inactive','disabled','archived'))";
            } else {
                $where = ' WHERE ' . catalogue_identifier($active) . ' = 1';
            }
        }

        $parts[] = 'SELECT '
            . catalogue_expr($columns, ['id'], 'id', '0') . ', '
            . catalogue_literal($table) . ' AS source_table, '
            . catalogue_literal($stoneType) . ' AS stone_type, '
            . catalogue_expr($columns, ['supplier', 'supplier_name'], 'supplier', catalogue_literal('Casero Stone')) . ', '
            . catalogue_expr($columns, ['brand', 'brand_name'], 'brand', catalogue_literal('Casero Stone')) . ', '
            . catalogue_expr($columns, ['product_code', 'code', 'stone_code', 'item_code', 'model_code', 'sku'], 'product_code', "''") . ', '
            . catalogue_expr($columns, ['product_name', 'name', 'stone_name', 'design_name', 'model_name', 'product'], 'product_name', "''") . ', '
            . catalogue_expr($columns, ['surface', 'surface_finish', 'finish', 'finish_name', 'texture'], 'surface', "''") . ', '
            . catalogue_expr($columns, ['thickness', 'thickness_mm', 'thicknesses'], 'thickness', "''") . ', '
            . catalogue_expr($columns, ['slab_size', 'size', 'slab_dimensions', 'dimensions', 'sheet_size'], 'slab_size', "''") . ', '
            . catalogue_expr($columns, ['series', 'collection'], 'series', "''") . ', '
            . catalogue_expr($columns, ['category', 'type'], 'category', catalogue_literal($stoneType)) . ', '
            . catalogue_expr($columns, ['image_filename', 'filename', 'image_file'], 'image_filename', "''") . ', '
            . catalogue_expr($columns, ['image_path', 'image_url', 'image', 'main_image', 'preview_image', 'zoom_image_path'], 'image_path', "''")
            . ' FROM ' . catalogue_identifier($table)
            . $where;
    }

    if (!$parts) {
        throw new RuntimeException('The Casero stone catalogue tables were not found.');
    }

    return implode("\nUNION ALL\n", $parts);
}

function catalogue_count_from_base(PDO $pdo, string $baseSql): int
{
    return (int)$pdo->query('SELECT COUNT(*) FROM (' . $baseSql . ') AS catalogue')->fetchColumn();
}
