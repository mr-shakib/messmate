import React, { useState, useEffect } from 'react';
import { useMessStore } from '../../store/messStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import api from '../../services/api';
import type { Mess, MemberRole } from '../../types';

interface MessSettingsProps {
  mess: Mess;
  onUpdate?: (mess: Mess) => void;
}

interface EditFormData {
  name: string;
  memberLimit: number;
  description: string;
}

interface FormErrors {
  name?: string;
  memberLimit?: string;
  description?: string;
}

export const MessSettings: React.FC<MessSettingsProps> = ({
  mess,
  onUpdate,
}) => {
  const { user } = useAuthStore();
  const { updateMess } = useMessStore();
  const { addToast } = useUIStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    name: mess.name,
    memberLimit: mess.memberLimit,
    description: mess.description || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Get current user's role
  const userRole = user
    ? mess.members.find((m) => m.userId === user.id)?.role
    : null;
  const isOwner = userRole === 'Owner';

  useEffect(() => {
    setFormData({
      name: mess.name,
      memberLimit: mess.memberLimit,
      description: mess.description || '',
    });
  }, [mess]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Mess name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Mess name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Mess name must not exceed 50 characters';
    }

    if (formData.memberLimit < 6) {
      newErrors.memberLimit = 'Member limit must be at least 6';
    } else if (formData.memberLimit > 20) {
      newErrors.memberLimit = 'Member limit must not exceed 20';
    } else if (formData.memberLimit < mess.members.length) {
      newErrors.memberLimit = `Member limit cannot be less than current member count (${mess.members.length})`;
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must not exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.put<{ data: Mess }>(`/messes/${mess.id}`, {
        name: formData.name.trim(),
        memberLimit: formData.memberLimit,
        description: formData.description.trim() || undefined,
      });

      const updatedMess = response.data.data;

      // Update store
      updateMess(mess.id, updatedMess);

      addToast('Mess settings updated successfully!', 'success');
      setIsEditing(false);
      onUpdate?.(updatedMess);
    } catch (error: any) {
      console.error('Failed to update mess:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: mess.name,
      memberLimit: mess.memberLimit,
      description: mess.description || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    if (!isOwner) return;

    try {
      await api.put(`/messes/${mess.id}/members/${memberId}/role`, {
        role: newRole,
      });

      // Update local state
      const updatedMembers = mess.members.map((m) =>
        m.userId === memberId ? { ...m, role: newRole } : m
      );

      updateMess(mess.id, { members: updatedMembers });
      addToast('Member role updated successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isOwner) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${memberName} from this mess?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/messes/${mess.id}/members/${memberId}`);

      // Update local state
      const updatedMembers = mess.members.filter((m) => m.userId !== memberId);
      updateMess(mess.id, { members: updatedMembers });

      addToast('Member removed successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to remove member:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mess Details Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Mess Details
          </h3>
          {isOwner && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mess Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isSubmitting}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                  ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }
                  disabled:bg-gray-100
                `}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Member Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Limit <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.memberLimit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    memberLimit: parseInt(e.target.value) || 0,
                  }))
                }
                disabled={isSubmitting}
                min={6}
                max={20}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                  ${
                    errors.memberLimit
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }
                  disabled:bg-gray-100
                `}
              />
              {errors.memberLimit && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.memberLimit}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                disabled={isSubmitting}
                rows={3}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                  ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }
                  disabled:bg-gray-100 resize-none
                `}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Name:</span>
              <p className="text-base font-medium text-gray-900">
                {mess.name}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Member Limit:</span>
              <p className="text-base font-medium text-gray-900">
                {mess.members.length} / {mess.memberLimit}
              </p>
            </div>
            {mess.description && (
              <div>
                <span className="text-sm text-gray-600">Description:</span>
                <p className="text-base text-gray-900">{mess.description}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-600">Invite Code:</span>
              <p className="text-base font-mono font-medium text-gray-900">
                {mess.inviteCode}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Members ({mess.members.length})
        </h3>

        <div className="space-y-3">
          {mess.members.map((member) => {
            const isCurrentUser = user?.id === member.userId;
            const canModify = isOwner && !isCurrentUser;

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {member.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm text-gray-500">
                          (You)
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {canModify && member.role !== 'Owner' ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(
                          member.userId,
                          e.target.value as MemberRole
                        )
                      }
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${
                          member.role === 'Owner'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'Admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }
                      `}
                    >
                      {member.role}
                    </span>
                  )}

                  {canModify && member.role !== 'Owner' && (
                    <button
                      onClick={() =>
                        handleRemoveMember(member.userId, member.name)
                      }
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove member"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
