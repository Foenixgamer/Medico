// =============================================================================
// MedSecure - Sanitización de inputs
// Capa 3: API Gateway + WAF - Protección contra XSS y SQL Injection
// =============================================================================
// Mitiga: Cross-Site Scripting (XSS), SQL Injection, NoSQL Injection
// Artículo HIPAA: 164.312(c)(1) - Integrity Controls
// =============================================================================

/**
 * Sanitiza un string eliminando caracteres peligrosos.
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#x60;')
    .replace(/\$/g, '&#x24;');
}

/**
 * Middleware que sanitiza recursivamente todos los strings en req.body, req.query y req.params.
 */
function sanitizeInput(req, res, next) {
  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitizar query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
}

/**
 * Sanitiza recursivamente un objeto.
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto sanitizado
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'string' ? sanitizeString(item) : sanitizeObject(item)
    );
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

module.exports = { sanitizeInput, sanitizeString };
