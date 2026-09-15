import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  X,
  Upload,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { resolveImage } from '../lib/api';

const emptySpec = () => ({
  label: '',
  value: '',
});

const makeId = () => {
  return Array.from({ length: 24 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

const sameSelection = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  return a.every((optA) =>
    b.some(
      (optB) =>
        String(optA.groupId) === String(optB.groupId) &&
        String(optA.optionId) === String(optB.optionId)
    )
  );
};

const emptyOption = () => ({
  _id: makeId(),
  label: '',
});

const emptyVariantGroup = () => ({
  _id: makeId(),
  name: '',
  options: [emptyOption()],
});

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: '',
    basePrice: '',
    discountPrice: '',
    shortDescription: '',
    description: '',
    isFeatured: false,
    isBestSeller: false,
    status: 'active',
    stock: 0,
    specifications: [],
    hasVariants: false,
    variants: [],
    variantCombinations: [],
  });

  useEffect(() => {
    adminApi.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    adminApi
      .getProduct(id)
      .then((p) => {
        const existingGroups = Array.isArray(p.variants)
          ? p.variants.map((group) => ({
            _id: group._id || makeId(),
            name: group.name || '',
            options: (group.options || []).map((option) => ({
              _id: option._id || makeId(),
              label: option.label || '',
            })),
          }))
          : [];

        let existingCombinations = Array.isArray(p.variantCombinations)
          ? p.variantCombinations.map((combination) => ({
            _id: combination._id || makeId(),
            options: (combination.options || []).map((selection) => ({
              groupId: String(selection.groupId),
              optionId: String(selection.optionId),
            })),
            priceModifier: Number(combination.priceModifier || 0),
            stock: Number(combination.stock || 0),
            sku: combination.sku || '',
          }))
          : [];

        if (
          existingGroups.length > 0 &&
          existingCombinations.length === 0 &&
          p.variants?.length === 1
        ) {
          const oldGroup = p.variants[0];

          existingCombinations = (oldGroup.options || []).map((option) => ({
            _id: makeId(),
            options: [
              {
                groupId: String(existingGroups[0]._id),
                optionId: String(option._id),
              },
            ],
            priceModifier: Number(option.priceModifier || 0),
            stock: Number(option.stock || 0),
            sku: option.sku || '',
          }));
        }

        setForm({
          name: p.name || '',
          brand: p.brand || '',
          category: p.category?._id || p.category || '',
          basePrice: p.basePrice ?? '',
          discountPrice: p.discountPrice ?? '',
          shortDescription: p.shortDescription || '',
          description: p.description || '',
          isFeatured: Boolean(p.isFeatured),
          isBestSeller: Boolean(p.isBestSeller),
          status: p.status || 'active',
          stock: p.stock || 0,
          specifications: p.specifications || [],
          hasVariants: existingGroups.length > 0,
          variants: existingGroups,
          variantCombinations: existingCombinations,
        });

        setImages(p.images || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load product.');
        setLoading(false);
      });
  }, [id, isEdit]);

  const set = (field) => (e) => {
    const value =
      e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;

    setForm((f) => ({
      ...f,
      [field]: value,
    }));
  };

  const updateSpec = (index, field, value) => {
    setForm((f) => ({
      ...f,
      specifications: f.specifications.map((spec, i) =>
        i === index
          ? { ...spec, [field]: value }
          : spec
      ),
    }));
  };

  const addSpec = () => {
    setForm((f) => ({
      ...f,
      specifications: [...f.specifications, emptySpec()],
    }));
  };

  const removeSpec = (index) => {
    setForm((f) => ({
      ...f,
      specifications: f.specifications.filter((_, i) => i !== index),
    }));
  };

  const addVariantGroup = () => {
    setForm((f) => ({
      ...f,
      variants: [...f.variants, emptyVariantGroup()],
    }));
  };

  const removeVariantGroup = (groupIndex) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== groupIndex),
      variantCombinations: [],
    }));
  };

  const updateVariantGroupName = (groupIndex, value) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((group, i) =>
        i === groupIndex ? { ...group, name: value } : group
      ),
    }));
  };

  const addVariantOption = (groupIndex) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((group, i) =>
        i === groupIndex
          ? { ...group, options: [...group.options, emptyOption()] }
          : group
      ),
    }));
  };

  const removeVariantOption = (groupIndex, optionIndex) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((group, i) =>
        i === groupIndex
          ? {
            ...group,
            options: group.options.filter((_, optionI) => optionI !== optionIndex),
          }
          : group
      ),
      variantCombinations: [],
    }));
  };

  const updateVariantOption = (groupIndex, optionIndex, value) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((group, i) =>
        i === groupIndex
          ? {
            ...group,
            options: group.options.map((option, optionI) =>
              optionI === optionIndex ? { ...option, label: value } : option
            ),
          }
          : group
      ),
    }));
  };

  const validVariantGroups = useMemo(() => {
    return form.variants
      .map((group) => ({
        ...group,
        name: group.name.trim(),
        options: group.options.filter((option) => option.label.trim()),
      }))
      .filter((group) => group.name && group.options.length > 0);
  }, [form.variants]);

  const combinationCount = useMemo(() => {
    if (!validVariantGroups.length) return 0;
    return validVariantGroups.reduce(
      (total, group) => total * group.options.length,
      1
    );
  }, [validVariantGroups]);

  const generateCombinations = () => {
    if (!validVariantGroups.length) {
      setForm((f) => ({ ...f, variantCombinations: [] }));
      return;
    }

    let combinations = [{ selections: [] }];

    for (const group of validVariantGroups) {
      const next = [];
      for (const combination of combinations) {
        for (const option of group.options) {
          next.push({
            selections: [
              ...combination.selections,
              { groupId: String(group._id), optionId: String(option._id) },
            ],
          });
        }
      }
      combinations = next;
    }

    setForm((f) => {
      const previous = f.variantCombinations || [];
      const newCombinations = combinations.map(({ selections }) => {
        const existing = previous.find((combination) =>
          sameSelection(combination.options, selections)
        );

        return (
          existing || {
            _id: makeId(),
            options: selections,
            priceModifier: 0,
            stock: 0,
            sku: '',
          }
        );
      });

      return {
        ...f,
        variantCombinations: newCombinations,
      };
    });
  };

  const updateCombination = (combinationIndex, field, value) => {
    setForm((f) => ({
      ...f,
      variantCombinations: f.variantCombinations.map((combination, index) =>
        index === combinationIndex
          ? { ...combination, [field]: value }
          : combination
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const hasVariants = form.hasVariants && validVariantGroups.length > 0;

      if (hasVariants) {
        if (form.variantCombinations.length === 0) {
          throw new Error('Generate the variant combinations before saving.');
        }

        if (form.variantCombinations.length > 5000) {
          throw new Error(
            'This product creates too many combinations. Please reduce the number of options.'
          );
        }
      }

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category,
        basePrice: Number(form.basePrice),
        discountPrice:
          form.discountPrice === '' ? null : Number(form.discountPrice),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        status: form.status,
        specifications: form.specifications.filter(
          (spec) => spec.label?.trim() && spec.value?.trim()
        ),
        variants: hasVariants
          ? validVariantGroups.map((group) => ({
            _id: group._id,
            name: group.name,
            options: group.options.map((option) => ({
              _id: option._id,
              label: option.label.trim(),
            })),
          }))
          : [],
        variantCombinations: hasVariants
          ? form.variantCombinations.map((combination) => ({
            _id: combination._id,
            options: combination.options,
            priceModifier: Number(combination.priceModifier || 0),
            stock: Number(combination.stock || 0),
            sku: combination.sku?.trim() || '',
          }))
          : [],
        stock: hasVariants ? 0 : Number(form.stock),
      };

      if (isEdit) {
        await adminApi.updateProduct(id, payload);
        navigate('/admin/products');
      } else {
        const created = await adminApi.createProduct(payload);
        navigate(`/admin/products/${created._id}/edit`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError('');

    try {
      const { images: updated } = await adminApi.uploadProductImages(id, files);
      setImages(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = async (url) => {
    try {
      const { images: updated } = await adminApi.deleteProductImage(id, url);
      setImages(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p className="text-ink-muted text-sm">Loading...</p>;
  }

  return (
    <div className="max-w-4xl">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to products
      </Link>

      <h1 className="font-display font-bold text-2xl text-ink mb-6">
        {isEdit ? 'Edit product' : 'Add product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* BASIC INFO */}
        <Section title="Basic info">
          <TextField
            label="Name"
            required
            value={form.name}
            onChange={set('name')}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Brand"
              value={form.brand}
              onChange={set('brand')}
            />

            <div>
              <FieldLabel required>Category</FieldLabel>
              <select
                required
                value={form.category}
                onChange={set('category')}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit"
              >
                <option value="">Select...</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TextField
            label="Short description"
            value={form.shortDescription}
            onChange={set('shortDescription')}
          />

          <div>
            <FieldLabel>Full description</FieldLabel>
            <textarea
              rows={4}
              value={form.description}
              onChange={set('description')}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit resize-none"
            />
          </div>
        </Section>

        {/* PRICING */}
        <Section title="Pricing">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Base price (৳)"
              required
              type="number"
              min="0"
              value={form.basePrice}
              onChange={set('basePrice')}
            />

            <TextField
              label="Discount price (৳, optional)"
              type="number"
              min="0"
              value={form.discountPrice}
              onChange={set('discountPrice')}
            />
          </div>
        </Section>

        {/* INVENTORY */}
        <Section title="Inventory">
          <label className="flex items-center gap-2 text-sm text-ink mb-3">
            <input
              type="checkbox"
              checked={form.hasVariants}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((f) => ({
                  ...f,
                  hasVariants: checked,
                  ...(checked
                    ? { stock: 0 }
                    : { variants: [], variantCombinations: [] }),
                }));
              }}
              className="accent-volt"
            />
            This product has variants (color, size, length...)
          </label>

          {!form.hasVariants ? (
            <TextField
              label="Stock quantity"
              type="number"
              min="0"
              value={form.stock}
              onChange={set('stock')}
            />
          ) : (
            <div className="space-y-6">
              {/* VARIANT GROUPS */}
              {form.variants.map((group, groupIndex) => (
                <div
                  key={group._id}
                  className="rounded-xl border border-line p-4 bg-paper"
                >
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <FieldLabel>Variant group {groupIndex + 1}</FieldLabel>
                      <input
                        value={group.name}
                        onChange={(e) =>
                          updateVariantGroupName(groupIndex, e.target.value)
                        }
                        placeholder="e.g. Color"
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeVariantGroup(groupIndex)}
                      className="p-2.5 text-ink-faint hover:text-stock-out"
                      title="Remove variant group"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <FieldLabel>Options</FieldLabel>
                    <div className="space-y-2 mt-2">
                      {group.options.map((option, optionIndex) => (
                        <div key={option._id} className="flex gap-2">
                          <input
                            value={option.label}
                            onChange={(e) =>
                              updateVariantOption(
                                groupIndex,
                                optionIndex,
                                e.target.value
                              )
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1 rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeVariantOption(groupIndex, optionIndex)
                            }
                            className="p-2 text-ink-faint hover:text-stock-out"
                            title="Remove option"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addVariantOption(groupIndex)}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-circuit hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add option
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addVariantGroup}
                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-line px-4 py-3 text-sm text-circuit hover:border-circuit hover:bg-circuit/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add variant group
              </button>

              {/* GENERATE COMBINATIONS */}
              {validVariantGroups.length > 0 && (
                <div className="rounded-xl border border-line bg-panel p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-ink">
                        Variant combinations
                      </h3>
                      <p className="text-xs text-ink-muted mt-1">
                        {combinationCount} combination
                        {combinationCount !== 1 ? 's' : ''} will be generated.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={generateCombinations}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-white px-4 py-2.5 text-sm font-medium hover:bg-ink/90"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Generate combinations
                    </button>
                  </div>
                </div>
              )}

              {/* COMBINATION TABLE */}
              {form.variantCombinations.length > 0 && (
                <div className="rounded-xl border border-line overflow-hidden">
                  <div className="px-4 py-3 bg-paper border-b border-line">
                    <h3 className="font-medium text-ink">
                      Inventory combinations
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Set stock, SKU, and price adjustments for each combination.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line bg-paper">
                          {validVariantGroups.map((group) => (
                            <th
                              key={group._id}
                              className="text-left px-4 py-3 font-medium text-ink-muted whitespace-nowrap"
                            >
                              {group.name}
                            </th>
                          ))}
                          <th className="text-left px-4 py-3 font-medium text-ink-muted whitespace-nowrap">
                            Price +/-
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-ink-muted whitespace-nowrap">
                            Stock
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-ink-muted whitespace-nowrap">
                            SKU
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {form.variantCombinations.map(
                          (combination, combinationIndex) => (
                            <tr
                              key={combination._id}
                              className="border-b border-line last:border-b-0"
                            >
                              {validVariantGroups.map((group) => {
                                const selection = combination.options.find(
                                  (sel) =>
                                    String(sel.groupId) === String(group._id)
                                );
                                const option = group.options.find(
                                  (opt) =>
                                    String(opt._id) ===
                                    String(selection?.optionId)
                                );

                                return (
                                  <td
                                    key={group._id}
                                    className="px-4 py-3 font-medium text-ink whitespace-nowrap"
                                  >
                                    {option?.label || '—'}
                                  </td>
                                );
                              })}

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={combination.priceModifier}
                                  onChange={(e) =>
                                    updateCombination(
                                      combinationIndex,
                                      'priceModifier',
                                      e.target.value
                                    )
                                  }
                                  className="w-24 rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-circuit"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={combination.stock}
                                  onChange={(e) =>
                                    updateCombination(
                                      combinationIndex,
                                      'stock',
                                      e.target.value
                                    )
                                  }
                                  className="w-20 rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-circuit"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={combination.sku}
                                  onChange={(e) =>
                                    updateCombination(
                                      combinationIndex,
                                      'sku',
                                      e.target.value
                                    )
                                  }
                                  placeholder="SKU"
                                  className="w-32 rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-circuit"
                                />
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* SPECIFICATIONS */}
        <Section title="Specifications">
          <div className="space-y-3">
            {form.specifications.map((spec, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Label (e.g. Material)"
                  value={spec.label}
                  onChange={(e) => updateSpec(index, 'label', e.target.value)}
                  className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Cotton)"
                  value={spec.value}
                  onChange={(e) => updateSpec(index, 'value', e.target.value)}
                  className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(index)}
                  className="p-2 text-ink-faint hover:text-stock-out"
                  title="Remove specification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addSpec}
              className="inline-flex items-center gap-1.5 text-sm text-circuit hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add specification
            </button>
          </div>
        </Section>

        {/* IMAGES */}
        {isEdit && (
          <Section title="Product Images">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((imgUrl, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg border border-line overflow-hidden aspect-square bg-paper"
                  >
                    <img
                      src={resolveImage(imgUrl)}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageDelete(imgUrl)}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white text-stock-out rounded-md shadow-sm transition-colors"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <label className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line p-4 cursor-pointer hover:border-circuit hover:bg-circuit/5 transition-colors aspect-square">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-circuit" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-ink-faint mb-1" />
                      <span className="text-xs text-ink-muted">Upload Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Section>
        )}

        {/* SETTINGS & VISIBILITY */}
        <Section title="Settings & Visibility">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Status</FieldLabel>
              <select
                value={form.status}
                onChange={set('status')}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isFeatured"
                checked={form.isFeatured}
                onChange={set('isFeatured')}
                className="accent-volt"
              />
              <label htmlFor="isFeatured" className="text-sm text-ink cursor-pointer">
                Featured Product
              </label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isBestSeller"
                checked={form.isBestSeller}
                onChange={set('isBestSeller')}
                className="accent-volt"
              />
              <label htmlFor="isBestSeller" className="text-sm text-ink cursor-pointer">
                Best Seller
              </label>
            </div>
          </div>
        </Section>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-3 text-sm text-stock-out bg-stock-out/10 rounded-lg border border-stock-out/20">
            {error}
          </div>
        )}

        {/* SUBMIT ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <Link
            to="/admin/products"
            className="px-4 py-2.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-circuit text-white px-5 py-2.5 text-sm font-medium hover:bg-circuit/90 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-line p-6 bg-paper space-y-4">
      <h2 className="font-display font-semibold text-lg text-ink border-b border-line pb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-medium text-ink-muted">
      {children}
      {required && <span className="text-stock-out ml-0.5">*</span>}
    </label>
  );
}

function TextField({ label, required, ...props }) {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <input
        {...props}
        className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-circuit"
      />
    </div>
  );
}