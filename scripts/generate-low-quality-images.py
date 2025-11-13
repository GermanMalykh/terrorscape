#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для создания низкокачественных версий всех изображений в приложении.
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
        
        # Определяем формат из расширения файла
        file_ext = os.path.splitext(output_path)[1].lower()
        
        # Сохраняем с низким качеством
        if file_ext == '.webp':
            low_img.save(output_path, 'WEBP', quality=quality, method=6)
        elif file_ext in ['.jpg', '.jpeg']:
            low_img.save(output_path, 'JPEG', quality=quality, optimize=True)
        elif file_ext == '.png':
            # Для PNG используем уменьшение палитры
            low_img = low_img.convert('RGB')
            low_img.save(output_path, 'WEBP', quality=quality, method=6)
        else:
            print(f"⚠ Неподдерживаемый формат: {file_ext}, пропускаю {input_path}")
            return False
        
        original_size = os.path.getsize(input_path)
        new_size_kb = os.path.getsize(output_path) / 1024
        
        print(f"✓ {os.path.basename(input_path)}: {original_size / 1024:.1f}KB -> {new_size_kb:.1f}KB")
        return True
    except Exception as e:
        print(f"✗ Ошибка при обработке {input_path}: {e}")
        return False

def process_directory(source_dir: str, target_dir: str, scale: float = 0.3, quality: int = 60):
    """
    Обрабатывает все изображения в директории.
    
    Args:
        source_dir: Исходная директория
        target_dir: Целевая директория для low-версий
        scale: Коэффициент масштабирования
        quality: Качество сжатия
    """
    if not os.path.exists(source_dir):
        print(f"⚠ Директория не найдена: {source_dir}")
        return 0
    
    # Находим все изображения
    image_extensions = ['.webp', '.jpg', '.jpeg', '.png']
    image_files = []
    
    for root, dirs, files in os.walk(source_dir):
        # Пропускаем уже обработанные low-директории
        if 'low' in root.split(os.sep):
            continue
            
        for file in files:
            if any(file.lower().endswith(ext) for ext in image_extensions):
                image_files.append(os.path.join(root, file))
    
    if not image_files:
        print(f"⚠ Изображения не найдены в: {source_dir}")
        return 0
    
    success_count = 0
    for image_path in sorted(image_files):
        # Вычисляем относительный путь
        rel_path = os.path.relpath(image_path, source_dir)
        output_path = os.path.join(target_dir, rel_path)
        
        if create_low_quality_image(image_path, output_path, scale, quality):
            success_count += 1
    
    return success_count

def main():
    base_dir = 'public/art'
    
    # Директории для обработки
    directories_to_process = [
        ('common', 'common/low'),
        ('killers', 'killers/low'),
        ('survivors', 'survivors/low'),
        # Коллекции уже обработаны, но можно добавить для полноты
        ('collections', 'collections/low'),
    ]
    
    print("=" * 60)
    print("Создание низкокачественных версий всех изображений...")
    print("=" * 60)
    
    total_success = 0
    total_files = 0
    
    for source_subdir, target_subdir in directories_to_process:
        source_dir = os.path.join(base_dir, source_subdir)
        target_dir = os.path.join(base_dir, target_subdir)
        
        print(f"\n📁 Обработка: {source_subdir}/")
        print("-" * 60)
        
        count = process_directory(source_dir, target_dir)
        total_success += count
        
        # Подсчитываем общее количество файлов для статистики
        if os.path.exists(source_dir):
            image_extensions = ['.webp', '.jpg', '.jpeg', '.png']
            files = [f for f in os.listdir(source_dir) 
                    if any(f.lower().endswith(ext) for ext in image_extensions)]
            total_files += len(files)
    
    print("\n" + "=" * 60)
    print(f"✅ Готово! Создано {total_success} из {total_files} низкокачественных версий.")
    print("=" * 60)

if __name__ == '__main__':
    main()

