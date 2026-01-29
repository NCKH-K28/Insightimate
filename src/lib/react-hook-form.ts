type AnyObj = Record<string, any>;

function hasAnyDirtyFlag(dirty: any): boolean {
  if (dirty === true) return true;
  if (!dirty) return false;
  if (Array.isArray(dirty)) return dirty.some(hasAnyDirtyFlag);
  if (typeof dirty === 'object') return Object.values(dirty).some(hasAnyDirtyFlag);
  return false;
}

// Trả về undefined nếu subtree không có dirty, còn có dirty thì trả về phần values tương ứng
function pickDirty(dirty: any, values: any): any {
  if (dirty === true) return values;
  if (!dirty) return undefined;

  // Với field array: thường PATCH thì nếu có phần tử dirty -> gửi cả mảng (an toàn)
  if (Array.isArray(dirty)) {
    return hasAnyDirtyFlag(dirty) ? values : undefined;
  }

  if (typeof dirty === 'object') {
    const result: AnyObj = {};
    for (const [key, childDirty] of Object.entries(dirty)) {
      const childValue = pickDirty(childDirty, values?.[key]);
      if (childValue !== undefined) result[key] = childValue;
    }
    return Object.keys(result).length ? result : undefined;
  }

  return undefined;
}

export function getDirtyValues<TValues extends AnyObj>(
  dirtyFields: any,
  allValues: TValues,
): Partial<TValues> {
  return (pickDirty(dirtyFields, allValues) ?? {}) as Partial<TValues>;
}
