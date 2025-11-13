#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для создания низкокачественных версий обложек коллекций.
Создает уменьшенные версии с более низким качеством для быстрой загрузки.
"""
import os
from PIL import Image

def create_low_quality_image(input_path: str, output_path: str, scale: float = 0.3, quality: int = 60):
    """
    Создает низкокачественную версию изображения.
    
    Args:
        input_path: Путь к исходному изображению
        output_path: Путь для сохранения low-версии
        scale: Коэффициент масштабирования (0.3 = 30% от оригинала)
        quality: Качество для WebP (0-100, где 60 - низкое качество)
    """
    try:
        # Открываем изображение
        img = Image.open(input_path)
        
        # Уменьшаем размер
        new_size = (int(img.width * scale), int(img.height * scale))
        low_img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Создаем директорию, если её нет
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Сохраняем с низким качеством
        low_img.save(output_path, 'WEBP', quality=quality, method=6)
        
        original_size = os.path.getsize(input_path)
        new_size_kb = os.path.getsize(output_path) / 1024
        
        print(f"✓ {os.path.basename(input_path)}: {original_size / 1024:.1f}KB -> {new_size_kb:.1f}KB")
        return True
    except Exception as e:
        print(f"✗ Ошибка при обработке {input_path}: {e}")
        return False

def main():
    collections_dir = 'public/art/collections'
    collections_low_dir = 'public/art/collections/low'
    
    # Создаем папку для low-версий
    os.makedirs(collections_low_dir, exist_ok=True)
    
    # Находим все .webp файлы в директории collections
    cover_files = [
        'amorphouse-cover.webp',
        'base-cover.webp',
        'feral-cover.webp',
        'lethal-cover.webp',
        'putrefied-cover.webp',
    ]
    
    print("Создание низкокачественных версий обложек...")
    print("-" * 60)
    
    success_count = 0
    for filename in cover_files:
        input_path = os.path.join(collections_dir, filename)
        output_path = os.path.join(collections_low_dir, filename)
        
        if os.path.exists(input_path):
            if create_low_quality_image(input_path, output_path):
                success_count += 1
        else:
            print(f"✗ Файл не найден: {input_path}")
    
    print("-" * 60)
    print(f"Готово! Создано {success_count} из {len(cover_files)} низкокачественных версий.")
    print(f"Low-версии сохранены в: {collections_low_dir}/")

if __name__ == '__main__':
    main()

