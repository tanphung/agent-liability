# Studio Deployment Troubleshooting

## Error: `Contract Queues not found`

Check the first line:

```python
# v0.2.16
```

There must be no blank line, shebang, encoding declaration, or invisible text before it.

## Error: `Contract IdlenessPhase not found`

Check the version header.

## Error: `Contract RevealingPhase not found`

Check the version header.

## Error: `AssertionError: TreeMap <- TreeMap`

Remove assignments like:

```python
self.some_map = TreeMap()
self.some_array = DynArray()
```

from `__init__`. GenVM initializes storage containers.

## Schema Parser Error

Check for:

- `float`
- `list`
- `dict`
- `Optional`
- custom classes in public signatures
- unsupported generic types
- incorrect storage containers

## Error: `module 'genlayer' has no attribute 'Contract'`

Use only:

```python
from genlayer import *
```

Do not alias-import GenLayer.

## Sidebar Says `Not deployed yet` Although Transaction Finalized

Click the transaction and inspect the execution result. Finalized does not guarantee successful execution.

## Deployment Worked Before But Fails Now

1. Reset Storage.
2. Hard refresh.
3. Deploy `storage_test.py`.
4. Inspect result.
5. Deploy main contracts only after sanity contract succeeds.

## Frontend Cannot Find Contract

Check:

- Studionet reset
- incorrect address
- missing `.env`
- wrong network
- chain not switched
- contract deployment execution error

## Wallet on Wrong Chain

The frontend calls:

```typescript
await client.connect("studionet");
```

Verify chain ID `61999`.
