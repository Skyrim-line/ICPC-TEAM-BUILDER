import React, { useMemo, useCallback, useReducer } from 'react'
import { Select, Spin } from 'antd'
import debounce from 'lodash/debounce'

const initialState = {
  options: [],
  loading: false,
  page: 1,
  hasMore: true
}

function reducer (state, action) {
  switch (action.type) {
    case 'SET_OPTIONS':
      return { ...state, options: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_PAGE':
      return { ...state, page: action.payload }
    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload }
    default:
      return state
  }
}

const DebounceSelect = ({ fetchOptions, debounceTimeout = 800, ...props }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { options, loading, page, hasMore } = state

  const loadOptions = useCallback(
    async (searchValue, newPage) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      const { options: newOptions, total } = await fetchOptions(
        searchValue,
        newPage
      )
      dispatch({
        type: 'SET_OPTIONS',
        payload: newPage === 1 ? newOptions : [...options, ...newOptions]
      })
      dispatch({
        type: 'SET_HAS_MORE',
        payload:
          newOptions.length > 0 && options.length + newOptions.length < total
      })
      dispatch({ type: 'SET_LOADING', payload: false })
    },
    [fetchOptions, options]
  )

  const debounceFetcher = useMemo(() => {
    return debounce((value) => {
      dispatch({ type: 'SET_PAGE', payload: 1 })
      dispatch({ type: 'SET_OPTIONS', payload: [] })
      loadOptions(value, 1)
    }, debounceTimeout)
  }, [loadOptions, debounceTimeout])

  const handleScroll = (event) => {
    const { target } = event
    if (
      target.scrollTop + target.offsetHeight === target.scrollHeight &&
      hasMore &&
      !loading
    ) {
      const newPage = page + 1
      dispatch({ type: 'SET_PAGE', payload: newPage })
      loadOptions(props.value, newPage)
    }
  }

  const handleClear = () => {
    dispatch({ type: 'SET_OPTIONS', payload: [] })
    dispatch({ type: 'SET_PAGE', payload: 1 })
    dispatch({ type: 'SET_HAS_MORE', payload: true })
    if (props.onClear) {
      props.onClear()
    }
  }

  return (
    <Select
      mode='multiple'
      {...props}
      allowClear
      filterOption={false}
      onSearch={debounceFetcher}
      onPopupScroll={handleScroll}
      onClear={handleClear}
      notFoundContent={loading ? <Spin size='small' /> : null}
      options={options}
    />
  )
}

export default DebounceSelect
