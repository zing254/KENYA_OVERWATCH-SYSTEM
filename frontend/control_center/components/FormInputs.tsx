import React, { useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  hint,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!error
  const hasSuccess = !!success && !hasError

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          transition-colors duration-200
          ${hasError ? 'border-red-500 focus:ring-red-500' : ''}
          ${hasSuccess ? 'border-green-500 focus:ring-green-500' : ''}
          ${!hasError && !hasSuccess ? 'border-gray-600 focus:ring-blue-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <div className="flex items-center gap-1 mt-1 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && !hasError && (
        <div className="flex items-center gap-1 mt-1 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}
      {hint && !hasError && !hasSuccess && (
        <p className="mt-1 text-gray-500 text-xs">{hint}</p>
      )}
    </div>
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!error

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          transition-colors duration-200 resize-y min-h-[100px]
          ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-blue-500'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <div className="flex items-center gap-1 mt-1 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {hint && !hasError && (
        <p className="mt-1 text-gray-500 text-xs">{hint}</p>
      )}
    </div>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!error

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`
          w-full px-3 py-2 bg-gray-700 border rounded-lg text-white
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          transition-colors duration-200
          ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-blue-500'}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" className="bg-gray-800">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-700 text-gray-300',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`
        font-medium rounded-lg transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        focus:ring-${variant === 'primary' ? 'blue' : variant === 'danger' ? 'red' : 'gray'}-500
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={inputId}
        className={`
          w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
          ${className}
        `}
        {...props}
      />
      {label && (
        <label htmlFor={inputId} className="text-sm text-gray-300">
          {label}
        </label>
      )}
    </div>
  )
}

export const FormGroup: React.FC<{ children: React.ReactNode; error?: string }> = ({ children, error }) => (
  <div className={`space-y-1 ${error ? 'error' : ''}`}>
    {children}
  </div>
)

export const FormError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    {message}
  </div>
)

export default Input
