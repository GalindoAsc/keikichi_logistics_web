#!/usr/bin/env python3
"""
Orphaned Files Cleanup Script

This script identifies and optionally deletes files in the uploads directory
that are not referenced in the database.

Usage:
    python cleanup_orphaned_files.py --dry-run  # Preview what would be deleted
    python cleanup_orphaned_files.py --delete   # Actually delete orphaned files
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.reservation import Reservation
from app.models.client_document import ClientDocument
from app.config import settings


async def get_referenced_files(db: AsyncSession) -> set:
    """Get all file paths that are referenced in the database."""
    referenced = set()
    
    # 1. Reservation files (tickets, summaries, payment proofs)
    reservations_stmt = select(
        Reservation.ticket_pdf_path,
        Reservation.invoice_pdf_path,
        Reservation.invoice_xml_path,
        Reservation.payment_proof_path
    )
    result = await db.execute(reservations_stmt)
    for row in result.all():
        for path in row:
            if path:
                referenced.add(path)
    
    # 2. Client documents
    documents_stmt = select(ClientDocument.file_path)
    result = await db.execute(documents_stmt)
    for row in result.scalars().all():
        if row:
            referenced.add(row)
    
    return referenced


def get_files_on_disk(upload_dir: str) -> dict:
    """Get all files in the uploads directory with their sizes."""
    files = {}
    upload_path = Path(upload_dir)
    
    if not upload_path.exists():
        return files
    
    for file_path in upload_path.rglob("*"):
        if file_path.is_file():
            # Store relative path from upload_dir
            rel_path = str(file_path.relative_to(upload_path))
            files[rel_path] = {
                "full_path": str(file_path),
                "size": file_path.stat().st_size,
                "modified": datetime.fromtimestamp(file_path.stat().st_mtime)
            }
    
    return files


async def find_orphaned_files(db: AsyncSession, upload_dir: str) -> list:
    """Find files on disk that are not referenced in the database."""
    referenced = await get_referenced_files(db)
    on_disk = get_files_on_disk(upload_dir)
    
    orphaned = []
    
    for rel_path, info in on_disk.items():
        # Check if this path is referenced (could be stored as relative or full path)
        is_referenced = False
        for ref_path in referenced:
            if ref_path and (rel_path in ref_path or ref_path.endswith(rel_path)):
                is_referenced = True
                break
        
        if not is_referenced:
            orphaned.append({
                "path": rel_path,
                "full_path": info["full_path"],
                "size": info["size"],
                "modified": info["modified"]
            })
    
    return orphaned


def format_size(size_bytes: int) -> str:
    """Format file size for display."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Clean up orphaned files")
    parser.add_argument("--dry-run", action="store_true", help="Preview without deleting")
    parser.add_argument("--delete", action="store_true", help="Actually delete files")
    args = parser.parse_args()
    
    if not args.dry_run and not args.delete:
        print("Please specify --dry-run or --delete")
        print(__doc__)
        return
    
    upload_dir = settings.upload_dir
    print(f"\n🔍 Scanning uploads directory: {upload_dir}")
    
    async with AsyncSessionLocal() as db:
        orphaned = await find_orphaned_files(db, upload_dir)
        
        if not orphaned:
            print("✅ No orphaned files found!")
            return
        
        # Calculate totals
        total_size = sum(f["size"] for f in orphaned)
        
        print(f"\n📁 Found {len(orphaned)} orphaned files ({format_size(total_size)} total)")
        print("-" * 60)
        
        # Group by directory
        by_dir = {}
        for f in orphaned:
            dir_name = Path(f["path"]).parent or "root"
            if dir_name not in by_dir:
                by_dir[dir_name] = []
            by_dir[dir_name].append(f)
        
        for dir_name, files in sorted(by_dir.items()):
            dir_size = sum(f["size"] for f in files)
            print(f"\n📂 {dir_name}/ ({len(files)} files, {format_size(dir_size)})")
            for f in files[:5]:  # Show first 5 per directory
                print(f"   - {Path(f['path']).name} ({format_size(f['size'])})")
            if len(files) > 5:
                print(f"   ... and {len(files) - 5} more")
        
        if args.delete:
            print("\n" + "=" * 60)
            confirm = input(f"⚠️  Delete {len(orphaned)} files? (yes/no): ")
            
            if confirm.lower() == "yes":
                deleted = 0
                freed = 0
                
                for f in orphaned:
                    try:
                        os.remove(f["full_path"])
                        deleted += 1
                        freed += f["size"]
                    except Exception as e:
                        print(f"❌ Error deleting {f['path']}: {e}")
                
                print(f"\n✅ Deleted {deleted} files, freed {format_size(freed)}")
            else:
                print("❌ Deletion cancelled")
        else:
            print("\n💡 Run with --delete to remove these files")


if __name__ == "__main__":
    asyncio.run(main())
