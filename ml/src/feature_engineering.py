import pandas as pd

def feature_engineer(df: pd.DataFrame) -> pd.DataFrame:
    """
    Performs feature engineering on the input DataFrame.
    This includes converting the 'week' column into numerical features
    that can be used by machine learning models.
    
    Args:
        df (pd.DataFrame): The input DataFrame, expected to have a 'week' column.
        
    Returns:
        pd.DataFrame: The DataFrame with new engineered features.
    """
    print("\n--- Feature Engineering ---")
    
    # Convert 'week' column to datetime objects for easier manipulation
    # Example format: '2026-W01' -> year 2026, week 1
    df["year"] = df["week"].apply(lambda x: int(x.split("-")[0]))
    df["week_of_year"] = df["week"].apply(lambda x: int(x.split("W")[1]))
    
    # Drop the original 'week' column as it's now represented by numerical features
    df = df.drop(columns=["week"])
    
    print("Feature engineering complete. New features: 'year', 'week_of_year'.")
    return df

if __name__ == "__main__":
    # This block is for testing the feature engineering function independently
    import os
    
    # Define the path to the dataset
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'cholera_dataset.csv')
    
    # Load the dataset
    df = pd.read_csv(data_path)
    
    print("Original DataFrame head:")
    print(df.head())
    
    engineered_df = feature_engineer(df)
    
    print("\nEngineered DataFrame head:")
    print(engineered_df.head())
    print("\nEngineered DataFrame info:")
    print(engineered_df.info())
