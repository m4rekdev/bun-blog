import templates from "./templates";

function replaceTemplates(input, customTemplates, parentTemplates) {
  const result = input.replace(/{{\s*(.*?)\s*}}/g, (match, templateKey) => {
      const keys = templateKey.split('.');
      let value = parentTemplates || templates;

      for (const key of keys) {
          if (value && value.hasOwnProperty(key)) {
              value = value[key];
          } else {
              return match;
          }
      }

      // If the value is an object (template), recursively replace placeholders
      if (typeof value === 'string') {
          value = replaceTemplates(value, customTemplates, parentTemplates || templates);
      }

      return value !== undefined ? value : match;
  });

  if (!customTemplates) return result;

  return result.replace(/{{\s*(.*?)\s*}}/g, (match, templateKey) => {
      const keys = templateKey.split('.');
      let value = customTemplates;

      for (const key of keys) {
          if (value && value.hasOwnProperty(key)) {
              value = value[key];
          } else {
              return match;
          }
      }

      return value !== undefined ? value : match;
  });
}

export default replaceTemplates;